import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Instagram as InstagramIcon, Heart, Play, Layers, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useHoverSound } from '../../hooks/useHoverSound';
import initialFeedData from '../../data/instagram_feed.json';

interface InstagramPost {
    id: string;
    title: string;
    permalink: string;
    image: string;
    type?: string;
    date?: string;
    likes: number;
    views?: string;
}

export function InstagramWidget({ accentColor = 'pink', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.fr').replace('@', '');
    const instagramUrl = `https://www.instagram.com/${account}/`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Likes state per post (with localStorage persistence)
    const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem('dropsiders_ig_liked') || '{}');
        } catch {
            return {};
        }
    });

    const [likesCount, setLikesCount] = useState<Record<string, number>>(() => {
        const counts: Record<string, number> = {};
        initialFeedData.posts.forEach((p: any) => {
            counts[p.id] = p.likes || 1200;
        });
        return counts;
    });

    const posts = initialFeedData.posts as InstagramPost[];

    const handleLike = (postId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        playHoverSound();
        setLikedPosts(prev => {
            const isLiked = !prev[postId];
            const updated = { ...prev, [postId]: isLiked };
            localStorage.setItem('dropsiders_ig_liked', JSON.stringify(updated));

            setLikesCount(cnt => ({
                ...cnt,
                [postId]: (cnt[postId] || 0) + (isLiked ? 1 : -1)
            }));

            return updated;
        });
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            playHoverSound();
            scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            playHoverSound();
            scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Widget Title Bar */}
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    INSTAGRAM
                </h3>
            </div>

            <motion.div
                whileHover={{ scale: 1.005 }}
                onMouseEnter={playHoverSound}
                className="flex-1 bg-dark-bg/50 border border-white/10 rounded-2xl p-0 backdrop-blur-sm shadow-2xl flex flex-col items-center transition-all duration-300 h-full min-h-[460px] sm:min-h-[560px]"
            >
                <div className="w-full flex-1 relative group rounded-xl overflow-hidden p-0 bg-white/5 flex flex-col min-h-[410px]">
                    <div
                        className="flex-1 bg-black/20 rounded-[11px] overflow-hidden flex flex-col justify-between"
                        style={{ border: `1px solid ${color}20` }}
                    >
                        {/* 1. Header Profile (Exact TikTok Layout Clone) */}
                        <div className="w-full p-4 sm:p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                {/* Profile Avatar */}
                                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-[0_0_12px_rgba(236,72,153,0.4)] flex-shrink-0">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black border-2 border-black overflow-hidden flex items-center justify-center">
                                        <img
                                            src="/images/instagram/avatar.jpg"
                                            alt="Dropsiders"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/logo.png';
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Username & 3 Columns Stats (Matching TikTok) */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-display font-bold text-base sm:text-lg tracking-tight truncate">
                                        @{account}
                                    </h4>

                                    <div className="flex items-center gap-5 mt-1">
                                        <div>
                                            <span className="text-white font-bold text-xs sm:text-sm block">1 434</span>
                                            <span className="text-gray-400 text-[10px] block">Publications</span>
                                        </div>
                                        <div>
                                            <span className="text-white font-bold text-xs sm:text-sm block">4 689</span>
                                            <span className="text-gray-400 text-[10px] block">Abonnés</span>
                                        </div>
                                        <div>
                                            <span className="text-white font-bold text-xs sm:text-sm block">120K+</span>
                                            <span className="text-gray-400 text-[10px] block">J'aime</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bio (Matching TikTok style) */}
                            <div className="text-[11px] sm:text-xs text-gray-300 leading-snug">
                                <p className="font-semibold text-white/90">Compte officiel de la page DROPSIDERS 📸</p>
                                <p className="text-gray-400">Média et reporter spécialisé FESTIVALS & MUSIQUE</p>
                            </div>
                        </div>

                        {/* 2. Horizontal Scrollable Publications Track (Matching TikTok carousel) */}
                        <div className="relative w-full px-4 pb-3 flex-1 flex flex-col justify-center">
                            {/* Scroll Arrows */}
                            <button
                                onClick={scrollLeft}
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/80 hover:bg-pink-500 border border-white/20 text-white flex items-center justify-center transition-all z-20 shadow-xl hover:scale-110 active:scale-95"
                                title="Faire défiler à gauche"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={scrollRight}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/80 hover:bg-pink-500 border border-white/20 text-white flex items-center justify-center transition-all z-20 shadow-xl hover:scale-110 active:scale-95"
                                title="Faire défiler à droite"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Cards Track with smooth horizontal scroll */}
                            <div
                                ref={scrollContainerRef}
                                className="flex gap-2.5 overflow-x-auto scrollbar-thin scroll-smooth py-1 px-1 snap-x snap-mandatory"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {posts.map((post) => {
                                    const isLiked = !!likedPosts[post.id];
                                    const likes = likesCount[post.id] || post.likes;

                                    return (
                                        <a
                                            key={post.id}
                                            href={post.permalink || instagramUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group relative flex-shrink-0 w-[140px] sm:w-[155px] aspect-[4/5] rounded-xl overflow-hidden bg-black/70 border border-white/10 hover:border-pink-500/60 shadow-lg hover:shadow-[0_0_15px_rgba(236,72,153,0.35)] transition-all snap-start block"
                                        >
                                            {/* Image full 4:5 visual */}
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />

                                            {/* Top Right Format Badge */}
                                            <div className="absolute top-1.5 right-1.5 z-10">
                                                <div className="w-5 h-5 rounded-md bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                                                    {post.type === 'video' ? (
                                                        <Play className="w-2.5 h-2.5 text-pink-400 fill-pink-400 ml-0.5" />
                                                    ) : (
                                                        <Layers className="w-2.5 h-2.5 text-white" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Left Stats (Likes Button) */}
                                            <div className="absolute bottom-2 left-2 z-10">
                                                <button
                                                    onClick={(e) => handleLike(post.id, e)}
                                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black backdrop-blur-md transition-all shadow-md ${isLiked ? 'bg-pink-500 text-white' : 'bg-black/70 text-white/90 hover:text-white border border-white/20'}`}
                                                >
                                                    <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-white' : 'text-pink-400'}`} />
                                                    <span>{likes > 999 ? `${(likes / 1000).toFixed(1)}K` : likes}</span>
                                                </button>
                                            </div>

                                            {/* Hover Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end z-10">
                                                <span className="text-[9px] font-bold text-white line-clamp-2 uppercase leading-tight drop-shadow">
                                                    {post.title}
                                                </span>
                                                <span className="text-[8px] font-black text-pink-400 uppercase mt-1 flex items-center gap-1">
                                                    <span>Voir</span>
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </span>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Intermediate Link Bar (Matching TikTok "TikTok ... Ouvrir TikTok") */}
                        <div className="w-full px-4 py-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center p-0.5 shadow-sm">
                                    <InstagramIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white">Instagram</span>
                            </div>

                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 rounded-lg bg-[#E1306C] hover:bg-[#C13584] text-white font-bold text-xs transition-colors shadow-md hover:scale-105 active:scale-95"
                            >
                                Ouvrir Instagram
                            </a>
                        </div>

                        {/* 4. Bottom Community Footer (Exact match with TikTok footer) */}
                        <div className="w-full p-2 sm:p-3 relative z-10 bg-gradient-to-t from-black/90 to-black/60 flex-none flex flex-col justify-center items-center">
                            <h4 className="text-white font-display font-bold text-base mb-1 uppercase tracking-wide">
                                Rejoignez la communauté
                            </h4>
                            <p className="text-gray-400 text-[10px] text-center mb-3">
                                Ne manquez aucune actu, festival et exclusivité sur notre compte Instagram.
                            </p>
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black uppercase tracking-tight rounded-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300 text-center text-sm"
                            >
                                S'abonner à @{account}
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
