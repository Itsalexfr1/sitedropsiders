import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import spotifyData from '../../data/spotify.json';

/**
 * Converts any Spotify URL to a valid embed URL.
 * Handles: direct links, intl links, tracking params, already-embed URLs.
 */
function toEmbedUrl(url: string): string {
    if (!url) return '';
    try {
        // Already an embed URL → return as-is
        if (url.includes('/embed/')) return url;

        const parsed = new URL(url);
        // Extract pathname, strip leading slash and intl segment if present
        // e.g. /intl-fr/track/xxx or /track/xxx or /playlist/xxx
        const parts = parsed.pathname.split('/').filter(Boolean);
        // Remove intl-xx prefix if present
        const filtered = parts.filter(p => !p.startsWith('intl-'));
        // filtered is now like ['track', 'id'] or ['playlist', 'id'] or ['album', 'id']
        if (filtered.length >= 2) {
            const type = filtered[0]; // 'track' | 'playlist' | 'album'
            const id = filtered[1].split('?')[0]; // strip any inline query
            return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
        }
        return url;
    } catch {
        return url;
    }
}

export function SpotifyWidget({
    accentColor = 'green',
    resolvedColor,
    showTitle = true,
    height = 480,
    itemWidth = '280px'
}: {
    accentColor?: string,
    resolvedColor?: string,
    showTitle?: boolean,
    height?: number,
    itemWidth?: string
}) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t } = useLanguage();
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playingWidget, setPlayingWidget] = useState<number | null>(null);
    const hoveredRef = useRef<number | null>(null);
    const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const response = await fetch(`/api/spotify?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    setPlaylists(data);
                } else {
                    setPlaylists(spotifyData);
                }
            } catch (error: any) {
                console.error('Error fetching playlists:', error);
                setPlaylists(spotifyData);
            }
        };
        fetchPlaylists();
    }, []);

    useEffect(() => {
        let pollInterval: ReturnType<typeof setInterval> | null = null;

        const checkActiveIframe = () => {
            if (document.activeElement?.tagName === 'IFRAME') {
                const idAttr = document.activeElement.getAttribute('data-playlist-id');
                if (idAttr) {
                    setPlayingWidget(Number(idAttr));
                }
            }
        };

        const handleWindowBlur = () => {
            setTimeout(() => {
                checkActiveIframe();
                pollInterval = setInterval(checkActiveIframe, 400);
            }, 50);
        };

        const handleWindowFocus = () => {
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
            cooldownRef.current = setTimeout(() => {
                setPlayingWidget(null);
            }, 300);
        };

        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        return () => {
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            if (pollInterval) clearInterval(pollInterval);
            if (cooldownRef.current) clearTimeout(cooldownRef.current);
        };
    }, []);

    // Convert all URLs to valid embed URLs before rendering
    const activePlaylists = playlists
        .filter(p => p.url)
        .map(p => ({ ...p, url: toEmbedUrl(p.url) }))
        .filter(p => p.url);

    if (activePlaylists.length === 0) return null;

    return (
        <div className="space-y-2">
            {showTitle && (
                <h3 className="text-2xl font-display font-bold text-white flex items-center md:center gap-3">
                    <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: activePlaylists[0]?.color || color,
                            boxShadow: `0 0 15px ${activePlaylists[0]?.color || color}`
                        }}
                    />
                    {t('home.playlists_title')}
                </h3>
            )}

            <div className={`flex gap-8 md:gap-16 overflow-x-auto py-8 px-6 sm:px-12 snap-x no-scrollbar relative z-10 ${activePlaylists.length <= 3 ? 'md:justify-center' : ''}`}>
                {activePlaylists.map((playlist) => {
                    const isPlaying = playingWidget === playlist.id;
                    return (
                        <motion.div
                            key={playlist.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            viewport={{ once: true }}
                            animate={{
                                scale: isPlaying ? 1.05 : 1,
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            onMouseEnter={() => { hoveredRef.current = playlist.id; }}
                            onMouseLeave={() => { hoveredRef.current = null; }}
                            className={`flex-none relative group rounded-[32px] snap-center transition-all duration-500 p-3 bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-2xl`}
                            style={{
                                width: `max(280px, min(85vw, ${itemWidth}))`,
                                borderColor: isPlaying ? playlist.color : 'rgba(255,255,255,0.1)',
                                boxShadow: isPlaying ? `0 0 40px ${playlist.color}40, inset 0 0 20px ${playlist.color}20` : 'none'
                            }}
                        >
                            {/* Glow exterior */}
                            <div
                                className="absolute -inset-10 opacity-0 group-hover:opacity-30 blur-[60px] transition-all duration-700 pointer-events-none rounded-[32px]"
                                style={{
                                    background: `radial-gradient(circle at center, ${playlist.color} 0%, transparent 70%)`,
                                    zIndex: 0
                                }}
                            />
                            {/* Glow interior */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-20 blur-[30px] transition-all duration-700 pointer-events-none rounded-[32px]"
                                style={{
                                    background: `radial-gradient(circle at center, ${playlist.color} 0%, transparent 70%)`,
                                    zIndex: 1
                                }}
                            />

                            <div className="relative z-10 rounded-[24px] overflow-hidden">
                                <iframe
                                    data-playlist-id={playlist.id}
                                    style={{ borderRadius: '16px' }}
                                    src={playlist.url}
                                    width="100%"
                                    height={height}
                                    frameBorder="0"
                                    allowFullScreen
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                    className={`w-full transition-all duration-500 shadow-2xl ${isPlaying
                                        ? 'grayscale-0 opacity-100'
                                        : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-90'
                                        }`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
