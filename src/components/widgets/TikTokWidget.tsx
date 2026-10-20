import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { Play, Flame, Music, ExternalLink, CheckCircle2, Video } from 'lucide-react';

export function TikTokWidget({ accentColor = 'cyan', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.fr').replace('@', '');
    const tiktokUrl = `https://www.tiktok.com/@${account}`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();

    // Vidéos phares / thématiques représentatives du contenu TikTok de Dropsiders
    const featuredHighlights = [
        {
            title: "Live Mainstage & Drops",
            views: "185.4K",
            tag: "FESTIVAL",
            icon: Flame,
            color: "from-red-500/30 to-pink-500/30"
        },
        {
            title: "Interviews DJs & Backstage",
            views: "92.1K",
            tag: "EXCLU",
            icon: Video,
            color: "from-cyan-500/30 to-blue-500/30"
        },
        {
            title: "IDs & Nouveautés Électro",
            views: "128.7K",
            tag: "TRACKS",
            icon: Music,
            color: "from-purple-500/30 to-indigo-500/30"
        }
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    TIKTOK
                </h3>
                <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                    <span>@{account}</span>
                    <ExternalLink className="w-3 h-3 text-[#00f2fe]" />
                </a>
            </div>

            <motion.div
                whileHover={{ scale: 1.01 }}
                onMouseEnter={playHoverSound}
                className="flex-1 bg-dark-bg/60 border border-white/10 rounded-2xl p-0 backdrop-blur-md shadow-2xl flex flex-col items-center transition-all duration-300 h-full min-h-[460px] sm:min-h-[560px] overflow-hidden"
            >
                <div className="w-full flex-1 relative group rounded-xl overflow-hidden p-0 bg-white/5 flex flex-col justify-between">
                    
                    {/* Header de profil TikTok immersif */}
                    <div className="p-5 sm:p-6 bg-gradient-to-b from-[#0a0f1d] via-[#05070e] to-transparent border-b border-white/5">
                        <div className="flex items-center gap-4">
                            {/* Avatar avec double anneau néon TikTok (Cyan & Rouge) */}
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-[#fe2c55] via-[#25f4ee] to-[#00f2fe] shadow-[0_0_20px_rgba(37,244,238,0.35)]">
                                    <div className="w-full h-full rounded-full bg-[#05070e] flex items-center justify-center overflow-hidden border border-white/10">
                                        <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00f2fe] border-2 border-black flex items-center justify-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                </span>
                            </div>

                            {/* Titres & Badge Vérifié */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-white font-display font-black text-lg tracking-tight uppercase">
                                        Dropsiders
                                    </h4>
                                    <CheckCircle2 className="w-4 h-4 text-[#20d5ec] shrink-0" />
                                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#fe2c55]/20 text-[#fe2c55] border border-[#fe2c55]/30 font-bold uppercase">
                                        OFFICIEL
                                    </span>
                                </div>
                                <p className="text-gray-400 font-mono text-xs">@{account}</p>
                                <p className="text-gray-300 text-[11px] mt-1 leading-snug font-medium line-clamp-2">
                                    Média n°1 Festivals & Musique Électronique • Coulisses, Scènes & DJ Sets en direct.
                                </p>
                            </div>
                        </div>

                        {/* Compteurs / Stats dynamiques */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
                            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                                <span className="block text-white font-black text-sm tracking-tight">100%</span>
                                <span className="text-[8px] text-gray-400 font-mono uppercase">Électro</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                                <span className="block text-[#00f2fe] font-black text-sm tracking-tight">+50</span>
                                <span className="text-[8px] text-gray-400 font-mono uppercase">Festivals</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                                <span className="block text-[#fe2c55] font-black text-sm tracking-tight">24/7</span>
                                <span className="text-[8px] text-gray-400 font-mono uppercase">Actu Vidéo</span>
                            </div>
                        </div>
                    </div>

                    {/* Grille d'aperçus de vidéos populaires (1-clic direct vers TikTok) */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center space-y-2.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400 tracking-wider">
                            <span>Vidéos & Formats Populaires</span>
                            <span className="text-[#00f2fe] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-ping" />
                                Tendance
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {featuredHighlights.map((item, idx) => {
                                const IconComponent = item.icon;
                                return (
                                    <a
                                        key={idx}
                                        href={tiktokUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`group/card relative p-3 rounded-xl bg-gradient-to-br ${item.color} border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between min-h-[90px]`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white font-bold tracking-wider">
                                                {item.tag}
                                            </span>
                                            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white group-hover/card:bg-[#fe2c55] transition-colors">
                                                <Play className="w-3 h-3 fill-current ml-0.5" />
                                            </div>
                                        </div>

                                        <div className="mt-2">
                                            <p className="text-white font-display font-black text-xs leading-snug line-clamp-2 uppercase">
                                                {item.title}
                                            </p>
                                            <span className="text-[8.5px] text-gray-300 font-mono mt-1 block">
                                                👁️ {item.views} vues
                                            </span>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bas de carte & Bouton d'Abonnement Officiel */}
                    <div className="w-full p-4 sm:p-5 relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent flex-none flex flex-col justify-center items-center border-t border-white/5">
                        <h4 className="text-white font-display font-bold text-base mb-1 uppercase tracking-wide flex items-center gap-1.5">
                            Rejoignez la communauté
                        </h4>
                        <p className="text-gray-400 text-[10px] text-center mb-3">
                            Ne manquez aucune actu, festival et exclusivité sur notre compte TikTok officiel.
                        </p>
                        <a
                            href={tiktokUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3.5 bg-gradient-to-r from-[#fe2c55] via-[#25f4ee] to-[#00f2fe] text-black font-display font-black uppercase italic tracking-wider rounded-xl hover:shadow-[0_0_25px_rgba(37,244,238,0.5)] transition-all duration-300 text-center text-sm flex items-center justify-center gap-2 group cursor-pointer"
                        >
                            <span>S'abonner à @{account}</span>
                            <ExternalLink className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
