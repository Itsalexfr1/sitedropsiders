import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useEffect, useState, useRef } from 'react';
import { Share2, Instagram as InstagramIcon, Heart, MessageCircle, ExternalLink } from 'lucide-react';

// Instagram's oEmbed only works on individual posts, not profiles.
// This widget shows the last post injected via Instagram's embed script,
// or falls back to a premium profile card.

interface InstagramPost {
    url: string;
    caption?: string;
}

export function InstagramWidget({
    accentColor = 'pink',
    resolvedColor,
    username,
    posts,
}: {
    accentColor?: string;
    resolvedColor?: string;
    username?: string;
    posts?: InstagramPost[];
}) {
    const account = (username || 'dropsiders.eu').replace('@', '');
    const instagramUrl = `https://www.instagram.com/${account}/`;
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const playHoverSound = useHoverSound();
    const containerRef = useRef<HTMLDivElement>(null);
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

    // Inject embed script when posts are present and in view
    useEffect(() => {
        if (!isInView || !posts?.length) return;
        const timer = setTimeout(() => {
            const existing = document.getElementById('instagram-embed-script');
            if (!existing) {
                const script = document.createElement('script');
                script.id = 'instagram-embed-script';
                script.src = 'https://www.instagram.com/embed.js';
                script.async = true;
                document.body.appendChild(script);
            } else {
                // If already loaded, tell Instagram to re-process new embeds
                (window as any).instgrm?.Embeds?.process();
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [isInView, posts]);

    const hasPosts = posts && posts.length > 0;

    return (
        <div className="h-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                    INSTAGRAM
                </h3>
                <Share2
                    className="w-4 h-4 text-gray-500 transition-colors cursor-pointer hover:text-white"
                    onMouseOver={(e) => e.currentTarget.style.color = color}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgb(107, 114, 128)'}
                />
            </div>

            <motion.div
                ref={containerRef}
                whileHover={{ scale: 1.01 }}
                onMouseEnter={playHoverSound}
                className="flex-1 bg-dark-bg/50 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-2xl flex flex-col items-center transition-all duration-300 h-full min-h-[450px] sm:min-h-[550px]"
                style={{ borderColor: `${color}20` }}
            >
                {hasPosts && isInView ? (
                    /* ── Posts embeds mode ── */
                    <div className="w-full flex-1 overflow-y-auto space-y-4 no-scrollbar">
                        {posts!.map((post, i) => (
                            <blockquote
                                key={i}
                                className="instagram-media"
                                data-instgrm-permalink={post.url}
                                data-instgrm-version="14"
                                style={{ background: '#FFF', border: 0, borderRadius: '8px', boxShadow: 'none', margin: 0, padding: 0, width: '100%' }}
                            />
                        ))}
                    </div>
                ) : (
                    /* ── Premium profile card (no post URLs configured) ── */
                    <div className="flex-1 flex flex-col items-center justify-between w-full gap-6">
                        {/* Profile hero */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
                            {/* Gradient ring avatar */}
                            <div className="relative">
                                <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                                    <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center overflow-hidden">
                                        <img
                                            src="/Logo.png"
                                            alt="Dropsiders Instagram"
                                            className="w-20 h-20 object-contain"
                                            onError={(e: any) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<span class="text-3xl">🎵</span>';
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                                    <InstagramIcon className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-white uppercase italic tracking-tight">@{account}</h4>
                                <p className="text-gray-400 text-sm">Dropsiders • Electronic Music Media</p>
                            </div>

                            {/* Fake stats bar */}
                            <div className="flex items-center gap-8 py-4 px-8 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-center">
                                    <p className="text-white font-black text-lg">+2K</p>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Posts</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-center">
                                    <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Contenu Exclu</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-center">
                                    <MessageCircle className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Communauté</p>
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed">
                                Récaps festivals, interviews exclusives, behind-the-scenes et lineup reveals.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="w-full space-y-3">
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white font-black uppercase tracking-tight rounded-2xl hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-300 text-sm"
                            >
                                <InstagramIcon className="w-5 h-5" />
                                Suivre @{account}
                            </a>
                            <a
                                href={instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all text-[10px]"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Voir le profil
                            </a>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
