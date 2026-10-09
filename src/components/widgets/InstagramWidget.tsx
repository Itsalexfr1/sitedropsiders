import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram as InstagramIcon, Play, Layers, ExternalLink, Sparkles, Heart } from 'lucide-react';
import { useHoverSound } from '../../hooks/useHoverSound';
import { resolveImageUrl } from '../../utils/image';
import initialFeedData from '../../data/instagram_feed.json';

interface InstagramPost {
    id: string;
    title: string;
    permalink: string;
    image: string;
    type?: 'video' | 'carousel' | 'image';
    date?: string;
    likes?: string;
}

interface InstagramProfile {
    username: string;
    name: string;
    avatar?: string;
    followers: string;
    postsCount: string;
    url: string;
}

export function InstagramWidget({ accentColor = 'pink', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.fr').replace('@', '');
    const defaultUrl = `https://www.instagram.com/${account}/`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);

    const [feed, setFeed] = useState<{ profile: InstagramProfile, posts: InstagramPost[] }>({
        profile: initialFeedData.profile,
        posts: initialFeedData.posts as InstagramPost[]
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);

    // IntersectionObserver to only load when approaching viewport
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

    // Fetch dynamic feed if available, otherwise fallback to local JSON
    useEffect(() => {
        if (!isInView) return;

        let isMounted = true;
        const fetchFeed = async () => {
            try {
                const res = await fetch('/api/instagram-feed');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.posts && data.posts.length > 0 && isMounted) {
                        setFeed({
                            profile: data.profile || initialFeedData.profile,
                            posts: data.posts
                        });
                    }
                }
            } catch (err) {
                console.warn('Instagram feed using fallback:', err);
            } finally {
                if (isMounted) setIsLoaded(true);
            }
        };

        fetchFeed();
        return () => { isMounted = false; };
    }, [isInView]);

    // Keep exactly 6 posts (2 rows of 3 columns) to fit the dimensions without vertical overflow
    const displayedPosts = (feed.posts || []).slice(0, 6);

    return (
        <div className="h-full flex flex-col pt-3">
            {/* Widget Title Bar */}
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    INSTAGRAM
                </h3>
                <a
                    href={feed.profile.url || defaultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-black tracking-widest text-pink-400 hover:text-white uppercase transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 hover:border-pink-500/50"
                >
                    <InstagramIcon className="w-3 h-3" />
                    <span>@{feed.profile.username || account}</span>
                </a>
            </div>

            <motion.div
                ref={containerRef}
                whileHover={{ scale: 1.005 }}
                onMouseEnter={playHoverSound}
                className="flex-1 bg-dark-bg/50 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-2xl flex flex-col justify-between transition-all duration-300 min-h-[560px]"
            >
                {/* 1. Profile Header (Instagram style) */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <a
                        href={feed.profile.url || defaultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 group/profile"
                    >
                        {/* Avatar with Story gradient ring */}
                        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-[0_0_12px_rgba(236,72,153,0.4)] group-hover/profile:scale-105 transition-transform flex-shrink-0">
                            <div className="w-11 h-11 rounded-full bg-black border-2 border-black overflow-hidden flex items-center justify-center">
                                <img
                                    src="https://www.dropsiders.fr/favicon.ico"
                                    alt="Dropsiders"
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/favicon.ico';
                                    }}
                                />
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-white uppercase tracking-tight group-hover/profile:text-pink-400 transition-colors truncate">
                                    {feed.profile.username || account}
                                </span>
                                <Sparkles className="w-3 h-3 text-pink-400 fill-pink-400 flex-shrink-0" />
                            </div>
                            <p className="text-[11px] text-gray-400 font-medium truncate">
                                {feed.profile.name || 'DROPSIDERS'}
                            </p>
                            <p className="text-[10px] text-gray-500 font-semibold tracking-wide mt-0.5">
                                {feed.profile.followers || '4 689'} followers • {feed.profile.postsCount || '1 434'} publications
                            </p>
                        </div>
                    </a>

                    <a
                        href={feed.profile.url || defaultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-pink-500/20 hover:border-pink-500/40 transition-all shadow-sm"
                        title="Voir le profil Instagram"
                    >
                        <InstagramIcon className="w-5 h-5 text-pink-400" />
                    </a>
                </div>

                {/* 2. Publications Grid (Strict 4:5 vertical proportions, exactly 6 items in 2 rows of 3) */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-3.5 flex-1 items-stretch">
                    {displayedPosts.map((post, idx) => {
                        const isVideo = post.type === 'video';
                        const isCarousel = post.type === 'carousel';

                        return (
                            <motion.a
                                key={post.id || idx}
                                href={post.permalink || defaultUrl}
                                target="_blank"
                                rel="noreferrer"
                                whileHover={{ y: -3 }}
                                className="group relative rounded-xl overflow-hidden bg-black/60 border border-white/10 hover:border-pink-500/60 shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all duration-300 flex flex-col aspect-[4/5]"
                            >
                                {/* Publication Visual */}
                                <img
                                    src={resolveImageUrl(post.image)}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />

                                {/* Format Badge (Video / Carousel) */}
                                <div className="absolute top-1.5 right-1.5 z-10">
                                    <div className="w-6 h-6 rounded-md bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                                        {isVideo ? (
                                            <Play className="w-3 h-3 text-pink-400 fill-pink-400 ml-0.5" />
                                        ) : isCarousel ? (
                                            <Layers className="w-3 h-3 text-white" />
                                        ) : (
                                            <InstagramIcon className="w-3 h-3 text-pink-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Hover Overlay with Full Details */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 sm:p-2.5 flex flex-col justify-end z-20">
                                    {post.likes && (
                                        <div className="flex items-center gap-1 text-[9px] font-black text-pink-400 mb-1">
                                            <Heart className="w-2.5 h-2.5 fill-pink-400" />
                                            <span>{post.likes}</span>
                                        </div>
                                    )}
                                    <p className="text-[9px] sm:text-[10px] font-bold text-white uppercase leading-tight line-clamp-2 drop-shadow-md">
                                        {post.title}
                                    </p>
                                    <div className="flex items-center gap-1 text-[8px] font-black text-pink-400 tracking-wider uppercase mt-1">
                                        <span>Voir le post</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </div>
                                </div>
                            </motion.a>
                        );
                    })}
                </div>

                {/* 3. Bottom Call To Action */}
                <div className="pt-2">
                    <a
                        href={feed.profile.url || defaultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <InstagramIcon className="w-4 h-4" />
                        <span>S'abonner à @{feed.profile.username || account}</span>
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
