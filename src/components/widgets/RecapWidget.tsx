import { motion } from 'framer-motion';
import { Play, ArrowUpRight } from 'lucide-react';
import newsData from '../../data/news.json';
import { Link } from 'react-router-dom';
import { useHoverSound } from '../../hooks/useHoverSound';

export function RecapWidget() {
    const latestRecaps = (newsData as any[])
        .filter((item: any) => item.category === 'Recap')
        .slice(0, 6);

    const playHoverSound = useHoverSound();

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_10px_#39ff14]" />
                    DERNIERS RÉCAPS
                </h3>
                <Link to="/recap" className="text-sm text-neon-green hover:underline transition-all flex items-center gap-1 font-bold tracking-tight">
                    TOUT VOIR <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            {latestRecaps.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border border-white/10 rounded-lg bg-dark-bg/40 backdrop-blur-md">
                    <p className="text-gray-400 font-display uppercase tracking-widest text-sm">Aucun récap pour le moment</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 gap-3">
                    {latestRecaps.map((item: any, index: number) => (
                        <Link to={`/recap/${item.id}`} key={item.id} className="block group">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={playHoverSound}
                                transition={{ delay: index * 0.1 }}
                                className="h-full group relative aspect-video rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-neon-green/50 transition-all duration-300 shadow-md"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-neon-green/20 transition-all duration-300">
                                        <Play className="w-4 h-4 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <span className="px-1 py-0.5 bg-dark-bg/60 backdrop-blur-md border border-neon-green text-neon-green text-[6px] font-black rounded shadow-[0_0_10px_rgba(57,255,20,0.3)] uppercase tracking-tighter">
                                        RECAP
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                    <h4 className="text-[11px] font-bold text-white leading-tight group-hover:text-neon-green transition-colors line-clamp-1">{item.title}</h4>
                                    <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{item.date}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
