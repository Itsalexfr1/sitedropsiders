import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram as InstagramIcon, ChevronLeft, ChevronRight, Heart, Share2, MessageCircle, ExternalLink, Sparkles, Layers, Play, LayoutGrid } from 'lucide-react';
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
}

export function InstagramWidget({ accentColor = 'pink', resolvedColor, username }: { accentColor?: string, resolvedColor?: string, username?: string }) {
    const account = (username || 'dropsiders.fr').replace('@', '');
    const defaultUrl = `https://www.instagram.com/${account}/`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);

    // View mode: 'carousel' or 'grid'
    const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Likes state per post (stored in localStorage for real interactive feel)
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
    const profile = initialFeedData.profile;

    const handleLike = (postId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        playHoverSound();
        setLikedPosts(prev => {
            const isLiked = !!prev[postId];
            const updated = { ...prev, [postId]: !isLiked };
            localStorage.setItem('dropsiders_ig_liked', JSON.stringify(updated));

            setLikesCount(cnt => ({
                ...cnt,
                [postId]: (cnt[postId] || 0) + (isLiked ? -1 : 1)
            }));

            return updated;
        });
    };

    const nextSlide = () => {
        playHoverSound();
        setCurrentIndex((prev) => (prev + 1) % posts.length);
    };

    const prevSlide = () => {
        playHoverSound();
        setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
    };

    const activePost = posts[currentIndex] || posts[0];
    const isLiked = !!likedPosts[activePost.id];
    const currentLikes = likesCount[activePost.id] || activePost.likes;

    return (
        <div className="w-full flex flex-col pt-3">
            {/* Widget Title Bar */}
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                    />
                    INSTAGRAM
                </h3>

                <div className="flex items-center gap-2">
                    {/* View Switcher: Carrousel / Grille */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 backdrop-blur-md">
                        <button
                            onClick={() => { playHoverSound(); setViewMode('carousel'); }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${viewMode === 'carousel' ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <span>Carrousel</span>
                        </button>
                        <button
                            onClick={() => { playHoverSound(); setViewMode('grid'); }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${viewMode === 'grid' ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutGrid className="w-3 h-3" />
                            <span>Grille</span>
                        </button>
                    </div>

                    <a
                        href={profile.url || defaultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black tracking-widest text-pink-400 hover:text-white uppercase transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 hover:border-pink-500/50"
                    >
                        <InstagramIcon className="w-3 h-3" />
                        <span>@{profile.username || account}</span>
                    </a>
                </div>
            </div>

            {/* Widget Container */}
            <motion.div
                ref={containerRef}
                className="w-full bg-dark-bg/60 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-2xl flex flex-col justify-between transition-all duration-300 min-h-[580px]"
            >
                {/* 1. Profile Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                    <a
                        href={profile.url || defaultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 group/profile"
                    >
                        {/* Avatar with Story gradient ring */}
                        <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-[0_0_14px_rgba(236,72,153,0.4)] group-hover/profile:scale-105 transition-transform flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-black border-2 border-black overflow-hidden flex items-center justify-center">
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

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-white uppercase tracking-tight group-hover/profile:text-pink-400 transition-colors truncate">
                                    {profile.username || account}
                                </span>
                                <Sparkles className="w-3.5 h-3.5 text-pink-400 fill-pink-400 flex-shrink-0" />
                            </div>
                            <p className="text-[11px] text-gray-400 font-medium truncate">
                                {profile.name || 'DROPSIDERS'}
                            </p>
                            <p className="text-[10px] text-gray-500 font-semibold tracking-wide mt-0.5">
                                {profile.followers || '4 689'} followers • {profile.postsCount || '1 434'} publications
                            </p>
                        </div>
                    </a>

                    <a
                        href={profile.url || defaultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-pink-500/20 hover:border-pink-500/40 transition-all shadow-sm"
                        title="Voir le compte Instagram"
                    >
                        <InstagramIcon className="w-5 h-5 text-pink-400" />
                    </a>
                </div>

                {/* 2. MAIN CONTENT (CAROUSEL OR GRID) */}
                {viewMode === 'carousel' ? (
                    <div className="relative my-4 flex-1 flex flex-col justify-center">
                        <div className="relative w-full max-w-[360px] mx-auto rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl group">
                            {/* Slide Visual (Aspect ratio 4:5 vertical Instagram) */}
                            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activePost.id}
                                        src={activePost.image}
                                        alt={activePost.title}
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.04 }}
                                        transition={{ duration: 0.25 }}
                                        className="w-full h-full object-cover"
                                    />
                                </AnimatePresence>

                                {/* Badges top right */}
                                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                                    <div className="px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/20 flex items-center gap-1 text-[10px] font-black text-white shadow-md">
                                        {activePost.type === 'video' ? (
                                            <>
                                                <Play className="w-3 h-3 text-pink-400 fill-pink-400" />
                                                <span>REEL</span>
                                            </>
                                        ) : (
                                            <>
                                                <Layers className="w-3 h-3 text-white" />
                                                <span>CARROUSEL</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Previous / Next Buttons */}
                                <button
                                    onClick={prevSlide}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-pink-500 text-white border border-white/20 hover:border-pink-400 flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 z-30 opacity-90 group-hover:opacity-100"
                                    title="Publication précédente"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-pink-500 text-white border border-white/20 hover:border-pink-400 flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 z-30 opacity-90 group-hover:opacity-100"
                                    title="Publication suivante"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Slide Actions: Like, Comment, Share & Post Link */}
                            <div className="p-3 bg-gradient-to-t from-black via-black/90 to-black/60 border-t border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        {/* Interactive Like Button */}
                                        <button
                                            onClick={(e) => handleLike(activePost.id, e)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all border ${isLiked ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-[0_0_12px_rgba(236,72,153,0.4)]' : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-white'}`}
                                        >
                                            <motion.div
                                                animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
                                            </motion.div>
                                            <span>{currentLikes.toLocaleString('fr-FR')}</span>
                                        </button>

                                        <a
                                            href={activePost.permalink || defaultUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                            title="Commenter sur Instagram"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                        </a>

                                        <a
                                            href={activePost.permalink || defaultUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                            title="Partager"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </a>
                                    </div>

                                    <a
                                        href={activePost.permalink || defaultUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] font-black text-pink-400 hover:text-white uppercase flex items-center gap-1 tracking-wider transition-colors"
                                    >
                                        <span>Voir le post</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                {/* Caption Title & Date */}
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-tight line-clamp-1">
                                        {activePost.title}
                                    </p>
                                    <span className="text-[9px] text-gray-500 font-semibold uppercase mt-0.5 block">
                                        {activePost.date}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Pagination Dots */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {posts.map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => { playHoverSound(); setCurrentIndex(idx); }}
                                    className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                                    title={`Slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* 3. GRID MODE (All 6 real posts in 2 rows of 3 columns, 100% visible) */
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-3.5 flex-1 items-stretch">
                        {posts.slice(0, 6).map((post) => {
                            const postLiked = !!likedPosts[post.id];
                            const postLikes = likesCount[post.id] || post.likes;

                            return (
                                <div
                                    key={post.id}
                                    className="group relative rounded-xl overflow-hidden bg-black/60 border border-white/10 hover:border-pink-500/60 shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all duration-300 flex flex-col aspect-[4/5]"
                                >
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />

                                    {/* Like Button on Thumbnail */}
                                    <button
                                        onClick={(e) => handleLike(post.id, e)}
                                        className={`absolute bottom-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black backdrop-blur-md transition-all ${postLiked ? 'bg-pink-500 text-white' : 'bg-black/60 text-white/80 hover:text-white border border-white/20'}`}
                                    >
                                        <Heart className={`w-3 h-3 ${postLiked ? 'fill-white' : ''}`} />
                                        <span>{postLikes.toLocaleString('fr-FR')}</span>
                                    </button>

                                    {/* Format Badge */}
                                    <div className="absolute top-1.5 right-1.5 z-10">
                                        <div className="w-5 h-5 rounded-md bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                                            {post.type === 'video' ? (
                                                <Play className="w-2.5 h-2.5 text-pink-400 fill-pink-400 ml-0.5" />
                                            ) : (
                                                <Layers className="w-2.5 h-2.5 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Link Overlay */}
                                    <a
                                        href={post.permalink || defaultUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 flex flex-col justify-end z-10"
                                    >
                                        <p className="text-[9px] font-bold text-white uppercase line-clamp-2 leading-tight">
                                            {post.title}
                                        </p>
                                        <span className="text-[8px] font-black text-pink-400 uppercase mt-1 flex items-center gap-1">
                                            <span>Ouvrir</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </span>
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 3. Bottom Subscribe CTA */}
                <div className="pt-2">
                    <a
                        href={profile.url || defaultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <InstagramIcon className="w-4 h-4" />
                        <span>S'abonner à @{profile.username || account}</span>
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
