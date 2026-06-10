import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, Loader2, Disc3 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import spotifyData from '../../data/spotify.json';
import { usePlayer } from '../../context/PlayerContext';

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
    itemWidth = '280px',
    hideTabs = false
}: {
    accentColor?: string,
    resolvedColor?: string,
    showTitle?: boolean,
    height?: number,
    itemWidth?: string,
    hideTabs?: boolean
}) {
    const color = resolvedColor || `var(--color-neon-${accentColor})`;
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { playTrack } = usePlayer();
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playingWidget, setPlayingWidget] = useState<number | null>(null);
    const hoveredRef = useRef<number | null>(null);
    const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // New state for community tab integration
    const [activeTab, setActiveTab] = useState<'playlists' | 'community'>('playlists');
    const [communityMixes, setCommunityMixes] = useState<any[]>([]);
    const [loadingCommunity, setLoadingCommunity] = useState(false);
    const [likedMixes, setLikedMixes] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('dropsiders_mix_likes') || '[]'));
        } catch {
            return new Set();
        }
    });

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
        if (activeTab === 'community' && communityMixes.length === 0) {
            const fetchCommunityMixes = async () => {
                setLoadingCommunity(true);
                try {
                    const res = await fetch('/api/community/mixes');
                    if (res.ok) {
                        const data = await res.json();
                        setCommunityMixes(data);
                    }
                } catch (err) {
                    console.error('Failed to fetch community mixes', err);
                } finally {
                    setLoadingCommunity(false);
                }
            };
            fetchCommunityMixes();
        }
    }, [activeTab, communityMixes.length]);

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

    const handleLikeMix = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (likedMixes.has(id)) return;

        const updated = new Set(likedMixes).add(id);
        setLikedMixes(updated);
        localStorage.setItem('dropsiders_mix_likes', JSON.stringify([...updated]));

        setCommunityMixes(prev => prev.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m));

        try {
            await fetch('/api/community/mixes/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        } catch (err) {
            console.error('Failed to submit like', err);
        }
    };

    // Convert all URLs to valid embed URLs before rendering
    const activePlaylists = playlists
        .filter(p => p.url)
        .map(p => ({ ...p, url: toEmbedUrl(p.url) }))
        .filter(p => p.url);

    return (
        <div className="space-y-6">
            {showTitle && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        <span
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{
                                backgroundColor: activeTab === 'playlists' ? (activePlaylists[0]?.color || color) : 'var(--color-neon-purple)',
                                boxShadow: `0 0 15px ${activeTab === 'playlists' ? (activePlaylists[0]?.color || color) : 'var(--color-neon-purple)'}`
                            }}
                        />
                        {activeTab === 'playlists' ? t('home.playlists_title') : 'Mixes de la Communauté'}
                    </h3>
                    
                    {!hideTabs && (
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit shrink-0 z-20">
                            <button
                                onClick={() => setActiveTab('playlists')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'playlists' 
                                        ? 'bg-white text-black shadow-lg font-black' 
                                        : 'text-gray-400 hover:text-white font-medium'
                                }`}
                            >
                                Nos Playlists
                            </button>
                            <button
                                onClick={() => setActiveTab('community')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'community' 
                                        ? 'bg-white text-black shadow-lg font-black' 
                                        : 'text-gray-400 hover:text-white font-medium'
                                }`}
                            >
                                Mixs Communauté
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'playlists' ? (
                activePlaylists.length === 0 ? null : (
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
                                    className="flex-none relative group rounded-[32px] snap-center transition-all duration-500 p-3 bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-2xl"
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
                )
            ) : (
                <div className="space-y-6">
                    {loadingCommunity ? (
                        <div className="py-24 flex flex-col items-center gap-4">
                            <div className="relative">
                                <Loader2 className="w-10 h-10 text-neon-purple animate-spin" />
                                <div className="absolute inset-0 rounded-full blur-lg bg-neon-purple/20 animate-pulse" />
                            </div>
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Chargement des mixes...</p>
                        </div>
                    ) : communityMixes.length === 0 ? (
                        <div className="py-20 border border-dashed border-white/10 rounded-[36px] flex flex-col items-center gap-4 text-center">
                            <Disc3 className="w-12 h-12 text-white/20 animate-spin-slow" />
                            <p className="text-white/30 font-black uppercase tracking-widest text-sm">Aucun mix public de la communauté pour le moment</p>
                        </div>
                    ) : (
                        <div className="flex gap-6 overflow-x-auto py-4 px-6 snap-x no-scrollbar relative z-10">
                            {communityMixes.map((mix) => (
                                <motion.div
                                    key={mix.id}
                                    whileHover={{ scale: 1.03 }}
                                    onClick={() => {
                                        playTrack({
                                            id: mix.id,
                                            title: mix.title,
                                            artist: mix.username || 'Dropsider',
                                            label: mix.genre || mix.type,
                                            url: mix.audioUrl || mix.url || '',
                                            embedUrl: mix.embedUrl && !mix.audioUrl ? mix.embedUrl : undefined,
                                            tracks: mix.tracklist || [],
                                            ownerEmail: mix.ownerEmail || mix.userEmail
                                        });
                                    }}
                                    className="flex-none w-[280px] p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] relative group cursor-pointer hover:border-neon-purple/40 hover:bg-white/[0.05] transition-all duration-300 snap-center"
                                >
                                    <div className="flex flex-col h-full justify-between gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 bg-neon-purple/10 border border-neon-purple/20 text-neon-purple rounded-full">
                                                    {mix.genre || mix.type || 'Mix'}
                                                </span>
                                                <button
                                                    onClick={(e) => handleLikeMix(e, mix.id)}
                                                    className={`flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full transition-all text-[8px] font-black tracking-widest ${
                                                        likedMixes.has(mix.id)
                                                            ? 'text-pink-500 border-pink-500/20 bg-pink-500/5'
                                                            : 'text-white/30 hover:text-pink-400 hover:border-pink-500/20'
                                                    }`}
                                                >
                                                    <Heart className={`w-2.5 h-2.5 ${likedMixes.has(mix.id) ? 'fill-current' : ''}`} />
                                                    {mix.likes || 0}
                                                </button>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-base font-display font-black text-white italic uppercase tracking-tight line-clamp-2 group-hover:text-neon-purple transition-colors leading-tight">
                                                    {mix.title}
                                                </h4>
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1.5 truncate">
                                                    Par {mix.username || 'Dropsider'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                                {mix.tracklist && mix.tracklist.length > 0 ? `${mix.tracklist.length} pistes` : 'Set complet'}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-neon-purple group-hover:text-white transition-all shadow-lg shadow-black/40">
                                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}


                </div>
            )}
        </div>
    );
}
