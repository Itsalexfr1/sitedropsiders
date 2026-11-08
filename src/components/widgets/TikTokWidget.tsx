import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Eye, ExternalLink } from 'lucide-react';
import { useHoverSound } from '../../hooks/useHoverSound';

interface TikTokPost {
    id: number | string;
    image: string;
    url: string;
    caption?: string;
    views?: number;
    likes?: number;
}

const FALLBACK_TIKTOK_POSTS: TikTokPost[] = [
    {
        id: 396159516,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159516.jpg?width=850",
        url: "https://www.tiktok.com/@dropsiders.fr/video/7705256023036071190",
        caption: "Notre sélection des événements à ne pas louper ce mois-ci !",
        views: 740,
        likes: 2
    },
    {
        id: 396159517,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159517.jpg?width=850",
        url: "https://www.tiktok.com/@dropsiders.fr/video/7705230813146664214",
        caption: "Top 10 des tracks les plus streamées sur Apple Music",
        views: 735,
        likes: 7
    },
    {
        id: 396159518,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159518.jpg?width=850",
        url: "https://www.tiktok.com/@dropsiders.fr/video/7705265759689215254",
        caption: "Pour ne rater aucune news, abonne-toi à Dropsiders",
        views: 728,
        likes: 0
    },
    {
        id: 396159519,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159519.jpg?width=850",
        url: "https://www.tiktok.com/@dropsiders.fr/video/7704293436563737878",
        caption: "Et si un DJ set de deux heures ne suffisait plus à James Hype ?",
        views: 738,
        likes: 1
    },
    {
        id: 396159520,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159520.jpg?width=850",
        url: "https://www.tiktok.com/@dropsiders.fr/video/7704292812631657761",
        caption: "Interview Konbini Hugel nouvel album",
        views: 726,
        likes: 5
    },
    {
        id: 396159521,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159521.jpg?width=850",
        url: "https://www.tiktok.com/@dropsiders.fr/video/7698539402221341984",
        caption: "Line-up officiel EDC Sea",
        views: 363,
        likes: 5
    }
];

const CURATOR_FEED_URL = "https://api.curator.io/v1/feeds/e4f58757-3f77-40df-af9c-87664185ba9c/posts";
const CACHE_KEY = "dropsiders_tt_posts_cache_v1";

export function TikTokWidget({ accentColor = 'cyan', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.fr').replace('@', '');
    const tiktokUrl = `https://www.tiktok.com/@${account}`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);

    const [posts, setPosts] = useState<TikTokPost[]>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch { }
        return FALLBACK_TIKTOK_POSTS;
    });

    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isInView) return;

        let isMounted = true;
        fetch(CURATOR_FEED_URL)
            .then(res => res.json())
            .then(data => {
                if (isMounted && data && Array.isArray(data.posts)) {
                    const ttPosts = data.posts
                        .filter((p: any) => p.network_id === 25 || (p.network_name && p.network_name.toLowerCase().includes('tiktok')))
                        .slice(0, 6)
                        .map((p: any) => {
                            let cleanText = p.text || '';
                            cleanText = cleanText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            return {
                                id: p.id,
                                image: p.image_large || p.image,
                                url: p.url || tiktokUrl,
                                caption: cleanText,
                                views: p.views || 0,
                                likes: p.likes || 0
                            };
                        });

                    if (ttPosts.length > 0) {
                        setPosts(ttPosts);
                        try {
                            localStorage.setItem(CACHE_KEY, JSON.stringify(ttPosts));
                        } catch { }
                    }
                }
            })
            .catch(() => { })
            .finally(() => {
                if (isMounted) setIsLoaded(true);
            });

        return () => { isMounted = false; };
    }, [isInView, tiktokUrl]);

    return (
        <div className="h-full flex flex-col">
            {/* Widget Header */}
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    TIKTOK
                </h3>
            </div>

            <motion.div
                ref={containerRef}
                whileHover={{ scale: 1.005 }}
                onMouseEnter={playHoverSound}
                className="flex-1 bg-dark-bg/50 border border-white/10 rounded-2xl p-0 backdrop-blur-sm shadow-2xl flex flex-col items-center transition-all duration-300 h-full min-h-[300px] sm:min-h-[380px] overflow-hidden"
            >
                <div className="w-full flex-1 relative group rounded-xl overflow-hidden p-0 bg-white/5 flex flex-col min-h-[220px]">
                    {/* Skeleton during first initial load */}
                    <AnimatePresence>
                        {!isLoaded && posts.length === 0 && (
                            <motion.div
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-xl"
                            >
                                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center animate-pulse border border-white/10">
                                    <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
                                    </svg>
                                </div>
                                <span className="mt-4 text-[9px] font-black text-white/30 uppercase tracking-widest animate-pulse">Chargement TikTok...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Official TikTok Box */}
                    <div
                        className="flex-1 bg-[#05070e] rounded-[11px] overflow-hidden flex flex-col justify-between"
                        style={{ border: `1px solid ${color}20` }}
                    >
                        {/* Official TikTok Header */}
                        <div className="w-full px-3 py-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
                            <a
                                href={tiktokUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 group/header"
                            >
                                <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#00f2fe] via-[#25f4ee] to-[#fe2c55] flex items-center justify-center shadow-sm">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white group-hover/header:text-cyan-400 transition-colors">
                                        @{account}
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-[#20d5ec] fill-[#20d5ec]" viewBox="0 0 24 24">
                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-4.1-4.1 1.4-1.4 2.7 2.7 6.4-6.4 1.4 1.4-7.8 7.8z" />
                                    </svg>
                                </div>
                            </a>

                            <a
                                href={tiktokUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-[#fe2c55] hover:bg-[#e0264b] text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                            >
                                Suivre
                            </a>
                        </div>

                        {/* Native TikTok Grid (3 cols x 2 rows in 4:5 or vertical ratio) */}
                        <div className="w-full p-1.5 flex-1 bg-black">
                            <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden bg-black">
                                {posts.slice(0, 6).map((post, idx) => (
                                    <a
                                        key={post.id || idx}
                                        href={post.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="relative w-full aspect-[4/5] overflow-hidden bg-[#111] group/item cursor-pointer block"
                                    >
                                        <img
                                            src={post.image}
                                            alt={post.caption || `TikTok video ${idx + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Play icon in top-right */}
                                        <div className="absolute top-1.5 right-1.5 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                                            <div className="w-4 h-4 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white">
                                                <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
                                            </div>
                                        </div>

                                        {/* Views counter at bottom left */}
                                        {post.views ? (
                                            <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 text-[9px] font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                                                <Eye className="w-2.5 h-2.5" />
                                                <span>{post.views}</span>
                                            </div>
                                        ) : null}

                                        {/* Hover Overlay with TikTok Play effect */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 text-white z-20 p-2 text-center">
                                            <div className="w-7 h-7 rounded-full bg-[#fe2c55]/80 flex items-center justify-center shadow-lg">
                                                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                                            </div>
                                            <span className="text-[9px] font-bold text-white/90 line-clamp-2 leading-tight">
                                                Regarder
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Bottom CTA Banner */}
                        <div className="w-full p-2.5 sm:p-3 relative z-10 bg-gradient-to-t from-black via-black/90 to-black/60 flex-none flex flex-col justify-center items-center border-t border-white/5">
                            <h4 className="text-white font-display font-bold text-sm mb-0.5 uppercase tracking-wide">
                                Rejoignez la communauté TikTok
                            </h4>
                            <p className="text-gray-400 text-[10px] text-center mb-2.5">
                                Ne manquez aucun récap, festival et exclusivité sur notre compte TikTok.
                            </p>
                            <a
                                href={tiktokUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2.5 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white font-black uppercase tracking-tight rounded-xl hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all duration-300 text-center text-xs flex items-center justify-center gap-1.5"
                            >
                                <span>S'abonner à @{account}</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
