import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram as InstagramIcon, Heart, Play, ExternalLink } from 'lucide-react';
import { useHoverSound } from '../../hooks/useHoverSound';

interface InstagramPost {
    id: number | string;
    image: string;
    url: string;
    caption?: string;
    likes?: number;
    hasVideo?: boolean;
}

const FALLBACK_POSTS: InstagramPost[] = [
    {
        id: 396159243,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159243.jpg?width=850",
        url: "https://www.instagram.com/p/Dfep0ZjiA2U/",
        caption: "Apple Music Club Radio WHP Manchester",
        likes: 1,
        hasVideo: true
    },
    {
        id: 396159244,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159244.jpg?width=850",
        url: "https://www.instagram.com/reel/DfcdCq_MGT-/",
        caption: "On va où ce mois-ci ?",
        likes: 2,
        hasVideo: true
    },
    {
        id: 396159245,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159245.jpg?width=850",
        url: "https://www.instagram.com/reel/DfcFAiYsVp3/",
        caption: "Top 10 Avicii tracks streamées",
        likes: 7,
        hasVideo: true
    },
    {
        id: 396159246,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159246.jpg?width=850",
        url: "https://www.instagram.com/reel/DfbM-YPKZ9o/",
        caption: "Pour ne rater aucune news",
        likes: 0,
        hasVideo: true
    },
    {
        id: 396159247,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159247.jpg?width=850",
        url: "https://www.instagram.com/p/DfaLaEbCBu-/",
        caption: "Insomniac Radio Open Decks",
        likes: 2,
        hasVideo: true
    },
    {
        id: 396159248,
        image: "https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159248.jpg?width=850",
        url: "https://www.instagram.com/p/DfZ9YW3CEtI/",
        caption: "XS Las Vegas nouvelle scénographie",
        likes: 6,
        hasVideo: true
    }
];

const CURATOR_FEED_URL = "https://api.curator.io/v1/feeds/e4f58757-3f77-40df-af9c-87664185ba9c/posts";
const CACHE_KEY = "dropsiders_ig_posts_cache_v3";

export function InstagramWidget({ accentColor = 'pink', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.fr').replace('@', '');
    const instagramUrl = `https://www.instagram.com/${account}/`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);

    const [posts, setPosts] = useState<InstagramPost[]>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch { }
        return FALLBACK_POSTS;
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

    // Fetch fresh posts when in view
    useEffect(() => {
        if (!isInView) return;

        let isMounted = true;
        fetch(CURATOR_FEED_URL)
            .then(res => res.json())
            .then(data => {
                if (isMounted && data && Array.isArray(data.posts) && data.posts.length > 0) {
                    const freshPosts: InstagramPost[] = data.posts
                        .filter((p: any) => {
                            const net = (p.network_name || '').toLowerCase();
                            const url = (p.url || '').toLowerCase();
                            return net.includes('instagram') || p.network_id === 1 || url.includes('instagram.com');
                        })
                        .slice(0, 6)
                        .map((p: any) => ({
                            id: p.id,
                            image: p.image_large || p.image,
                            url: p.url || instagramUrl,
                            caption: p.text || '',
                            likes: p.likes || 0,
                            hasVideo: Boolean(p.has_video)
                        }));

                    if (freshPosts.length > 0) {
                        setPosts(freshPosts);
                        try {
                            localStorage.setItem(CACHE_KEY, JSON.stringify(freshPosts));
                        } catch { }
                    }
                }
            })
            .catch(() => {
                // Keep existing or fallback
            })
            .finally(() => {
                if (isMounted) setIsLoaded(true);
            });

        return () => { isMounted = false; };
    }, [isInView, instagramUrl]);

    return (
        <div className="h-full flex flex-col">
            {/* Widget Title Header */}
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                    <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    INSTAGRAM
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
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 p-0.5 animate-pulse">
                                    <div className="w-full h-full bg-black/60 rounded-[14px] flex items-center justify-center">
                                        <InstagramIcon className="w-8 h-8 text-pink-500" />
                                    </div>
                                </div>
                                <span className="mt-4 text-[9px] font-black text-white/30 uppercase tracking-widest animate-pulse">Chargement flux Instagram...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Official Instagram Box */}
                    <div
                        className="flex-1 bg-[#05070e] rounded-[11px] overflow-hidden flex flex-col justify-between"
                        style={{ border: `1px solid ${color}20` }}
                    >
                        {/* Official Instagram Header */}
                        <div className="w-full px-3 py-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2.5 group/header"
                            >
                                <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-sm">
                                    <img
                                        src="https://curator-assets.b-cdn.net/e4f58757-3f77-40df-af9c-87664185ba9c/396159243_user_image.jpg?width=100"
                                        alt={account}
                                        className="w-full h-full rounded-full object-cover border border-black bg-black"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white group-hover/header:text-pink-400 transition-colors">
                                        {account}
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-[#0095f6] fill-[#0095f6]" viewBox="0 0 24 24">
                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-4.1-4.1 1.4-1.4 2.7 2.7 6.4-6.4 1.4 1.4-7.8 7.8z" />
                                    </svg>
                                </div>
                            </a>

                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-[#0095f6] hover:bg-[#1877f2] text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                            >
                                Suivre
                            </a>
                        </div>

                        {/* Native 4:5 Posts Grid (3 cols x 2 rows) */}
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
                                            alt={post.caption || `Instagram post ${idx + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Type badge (Reel or Carousel) in top-right */}
                                        <div className="absolute top-1.5 right-1.5 z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                                            {post.hasVideo ? (
                                                <div className="w-4 h-4 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                                                    <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
                                                </div>
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                                                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <rect x="3" y="3" width="13" height="13" rx="2" />
                                                        <path d="M8 8h13v13" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover Overlay with Likes & Official Icon */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white z-20">
                                            <Heart className="w-3.5 h-3.5 fill-white text-white" />
                                            <span className="text-xs font-bold">{post.likes || 1}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Bottom CTA Banner */}
                        <div className="w-full p-2.5 sm:p-3 relative z-10 bg-gradient-to-t from-black via-black/90 to-black/60 flex-none flex flex-col justify-center items-center border-t border-white/5">
                            <h4 className="text-white font-display font-bold text-sm mb-0.5 uppercase tracking-wide">
                                Rejoignez la communauté
                            </h4>
                            <p className="text-gray-400 text-[10px] text-center mb-2.5">
                                Ne manquez aucune actu, festival et exclusivité sur notre compte Instagram.
                            </p>
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2.5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black uppercase tracking-tight rounded-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300 text-center text-xs flex items-center justify-center gap-1.5"
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
