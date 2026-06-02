import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Trophy, Headphones, PlayCircle, PauseCircle, Download, Share2, MessageSquare, Star, ArrowLeft } from 'lucide-react';
import { DropsidersCardComponent } from '../components/cards/DropsidersCard';

const categoryStyles = {
    Track: {
        colorName: 'neon-red',
        text: 'text-neon-red',
        bg: 'bg-neon-red',
        bgLight: 'bg-neon-red/10',
        bgBg: 'bg-neon-red/5',
        border: 'border-neon-red',
        borderLight: 'border-neon-red/20',
        borderDashed: 'border-neon-red/30',
        hoverBorder: 'hover:border-neon-red/50',
        hoverBg: 'hover:bg-neon-red/10',
        hoverBgCard: 'hover:bg-neon-red/5',
        cardBorder: 'hover:border-neon-red/30',
        textMuted: 'text-neon-red/50',
        groupHoverText: 'group-hover:text-neon-red',
        selectedText: 'text-white',
        shadow: 'shadow-[0_0_15px_rgba(255,0,0,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(255,0,0,0.5)]',
    },
    Remix: {
        colorName: 'neon-purple',
        text: 'text-neon-purple',
        bg: 'bg-neon-purple',
        bgLight: 'bg-neon-purple/10',
        bgBg: 'bg-neon-purple/5',
        border: 'border-neon-purple',
        borderLight: 'border-neon-purple/20',
        borderDashed: 'border-neon-purple/30',
        hoverBorder: 'hover:border-neon-purple/50',
        hoverBg: 'hover:bg-neon-purple/10',
        hoverBgCard: 'hover:bg-neon-purple/5',
        cardBorder: 'hover:border-neon-purple/30',
        textMuted: 'text-neon-purple/50',
        groupHoverText: 'group-hover:text-neon-purple',
        selectedText: 'text-white',
        shadow: 'shadow-[0_0_15px_rgba(188,19,254,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(188,19,254,0.5)]',
    },
    Edit: {
        colorName: 'neon-cyan',
        text: 'text-neon-cyan',
        bg: 'bg-neon-cyan',
        bgLight: 'bg-neon-cyan/10',
        bgBg: 'bg-neon-cyan/5',
        border: 'border-neon-cyan',
        borderLight: 'border-neon-cyan/20',
        borderDashed: 'border-neon-cyan/30',
        hoverBorder: 'hover:border-neon-cyan/50',
        hoverBg: 'hover:bg-neon-cyan/10',
        hoverBgCard: 'hover:bg-neon-cyan/5',
        cardBorder: 'hover:border-neon-cyan/30',
        textMuted: 'text-neon-cyan/50',
        groupHoverText: 'group-hover:text-neon-cyan',
        selectedText: 'text-black',
        shadow: 'shadow-[0_0_15px_rgba(0,240,255,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(0,240,255,0.5)]',
    },
    Mix: {
        colorName: 'neon-green',
        text: 'text-neon-green',
        bg: 'bg-neon-green',
        bgLight: 'bg-neon-green/10',
        bgBg: 'bg-neon-green/5',
        border: 'border-neon-green',
        borderLight: 'border-neon-green/20',
        borderDashed: 'border-neon-green/30',
        hoverBorder: 'hover:border-neon-green/50',
        hoverBg: 'hover:bg-neon-green/10',
        hoverBgCard: 'hover:bg-neon-green/5',
        cardBorder: 'hover:border-neon-green/30',
        textMuted: 'text-neon-green/50',
        groupHoverText: 'group-hover:text-neon-green',
        selectedText: 'text-black',
        shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(57,255,20,0.5)]',
    }
};

const getCategoryStyle = (type: string) => {
    const normalized = (type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : '') as keyof typeof categoryStyles;
    return categoryStyles[normalized] || categoryStyles.Remix;
};

export function PublicProfile() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'cards' | 'mixes' | 'reviews'>('cards');
    const [playingMixId, setPlayingMixId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const trackedPlaysRef = useRef<Set<string>>(new Set());

    // Helper: silently track an event
    const trackMixEvent = (mix: any, event: 'play' | 'download' | 'share') => {
        if (!profile?.email) return;
        fetch('/api/mix/stats/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mixId: mix.id, event, ownerEmail: profile.email })
        }).catch(() => {/* silent */});
    };

    useEffect(() => {
        setIsLoading(true);

        const findInLocalStorage = () => {
            try {
                // Check in registered users list (correct key used throughout the app)
                const allUsers = JSON.parse(localStorage.getItem('dropsiders_registered_users') || '[]');
                const found = allUsers.find((u: any) =>
                    u.username?.toLowerCase() === username?.toLowerCase()
                );
                if (found) return found;

                // Also check the current logged-in user's own data
                const currentUser = JSON.parse(localStorage.getItem('dropsiders_user') || 'null');
                if (currentUser?.username?.toLowerCase() === username?.toLowerCase()) {
                    return currentUser;
                }
                return null;
            } catch {
                return null;
            }
        };

        // Fetch from the real backend
        fetch(`/api/user/profile?username=${encodeURIComponent(username || '')}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setProfile(data);
                } else {
                    setProfile(findInLocalStorage());
                }
                setIsLoading(false);
            })
            .catch(() => {
                setProfile(findInLocalStorage());
                setIsLoading(false);
            });
    }, [username]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#050505] pt-32 px-6 flex items-center justify-center text-center">
                <div className="space-y-4">
                    <User className="w-16 h-16 text-gray-700 mx-auto" />
                    <h1 className="text-2xl font-black text-white">Utilisateur introuvable</h1>
                    <p className="text-gray-500 text-sm">Ce profil n'existe pas ou est privé.</p>
                    <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 border border-white/10 rounded-xl text-white/60 text-sm font-bold hover:bg-white/5 transition-all">
                        ← Retour
                    </button>
                </div>
            </div>
        );
    }

    const collectedCards: any[] = profile.collectedCards || [];
    // Group by card ID to get uniques
    const grouped = collectedCards.reduce((acc: any, card: any) => {
        if (!acc[card.id]) acc[card.id] = { card, count: 0 };
        acc[card.id].count += 1;
        return acc;
    }, {});
    const uniqueCards = Object.values(grouped) as { card: any; count: number }[];

    const stats = [
        { label: 'DROPS', value: profile.drops || 0, color: 'text-neon-cyan', bg: 'from-neon-cyan/20' },
        { label: 'XP', value: profile.xp || 0, color: 'text-amber-400', bg: 'from-amber-500/20' },
        { label: 'CARTES', value: uniqueCards.length, color: 'text-neon-purple', bg: 'from-neon-purple/20' },
        { label: 'MIXES', value: profile.mixes?.length || 0, color: 'text-neon-red', bg: 'from-neon-red/20' },
    ];

    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    const sortedCards = [...uniqueCards].sort((a, b) =>
        (rarityOrder[a.card.rarity as keyof typeof rarityOrder] ?? 9) - (rarityOrder[b.card.rarity as keyof typeof rarityOrder] ?? 9)
    );

    return (
        <div className="min-h-screen bg-[#050505] pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10 space-y-8">

                {/* Back button */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold">
                    <ArrowLeft className="w-4 h-4" /> Retour
                </button>

                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-red" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.08),transparent_60%)] pointer-events-none" />

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 border-2 border-white/10 p-1 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-full">
                                    <User className="w-16 h-16 text-gray-600" />
                                </div>
                            )}
                        </div>
                        {profile.handle && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-neon-cyan/20 border border-neon-cyan/40 rounded-full">
                                <span className="text-[10px] font-black text-neon-cyan">@{profile.handle}</span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1 relative z-10">
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-1">
                            {profile.username}
                        </h1>
                        {profile.instagram && (
                            <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-pink-400 font-bold hover:underline mb-4">
                                📸 {profile.instagram.startsWith('@') ? profile.instagram : `@${profile.instagram}`}
                            </a>
                        )}
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">
                            Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            {stats.map((s, i) => (
                                <div key={i} className={`px-4 py-3 bg-gradient-to-br ${s.bg} to-transparent border border-white/10 rounded-2xl min-w-[80px] text-center`}>
                                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
                    {[
                        { id: 'cards', label: `🃏 Collection (${uniqueCards.length})` },
                        { id: 'mixes', label: `🎧 Mixes (${profile.mixes?.length || 0})` },
                        { id: 'reviews', label: `⭐ Avis (${profile.reviews?.length || 0})` },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>

                        {/* CARDS TAB */}
                        {activeTab === 'cards' && (
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 sm:p-8">
                                {sortedCards.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
                                        {sortedCards.map(({ card, count }) => (
                                            <div key={card.id} className="relative group">
                                                {count > 1 && (
                                                    <div className="absolute top-2 left-2 z-40 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                                        x{count}
                                                    </div>
                                                )}
                                                <DropsidersCardComponent card={card} scale={0.75} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Ce Dropsider n'a aucune carte</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MIXES TAB */}
                        {activeTab === 'mixes' && (
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 sm:p-8">
                                {profile.mixes && profile.mixes.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.mixes.map((mix: any) => {
                                            const style = getCategoryStyle(mix.type);
                                            const isPlaying = playingMixId === mix.id;

                                            const handlePlay = () => {
                                                // Stop current
                                                if (audioRef.current) {
                                                    audioRef.current.pause();
                                                    audioRef.current = null;
                                                }
                                                if (playTimerRef.current) clearTimeout(playTimerRef.current);

                                                if (isPlaying) {
                                                    setPlayingMixId(null);
                                                    return;
                                                }

                                                setPlayingMixId(mix.id);

                                                if (mix.audioUrl) {
                                                    const audio = new Audio(mix.audioUrl);
                                                    audio.play().catch(() => {});
                                                    audioRef.current = audio;
                                                    audio.onended = () => setPlayingMixId(null);
                                                }

                                                // Track play only once per session, after 10s
                                                if (!trackedPlaysRef.current.has(mix.id)) {
                                                    playTimerRef.current = setTimeout(() => {
                                                        trackedPlaysRef.current.add(mix.id);
                                                        trackMixEvent(mix, 'play');
                                                    }, 10000);
                                                }
                                            };

                                            const handleDownload = () => {
                                                if (mix.audioUrl && mix.allowDownload) {
                                                    trackMixEvent(mix, 'download');
                                                    const a = document.createElement('a');
                                                    a.href = mix.audioUrl;
                                                    a.download = mix.title + '.mp3';
                                                    a.click();
                                                }
                                            };

                                            const handleShare = () => {
                                                trackMixEvent(mix, 'share');
                                                const url = window.location.href;
                                                if (navigator.share) {
                                                    navigator.share({ title: mix.title, url });
                                                } else {
                                                    navigator.clipboard.writeText(url).catch(() => {});
                                                }
                                            };

                                            return (
                                                <div key={mix.id} className={`group p-4 bg-white/5 border border-white/5 ${style.cardBorder} rounded-2xl transition-all ${style.hoverBgCard}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={handlePlay}
                                                                className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center shadow-lg ${style.shadow} transition-transform hover:scale-110 active:scale-95`}
                                                            >
                                                                {isPlaying ? <PauseCircle className="w-6 h-6 text-white" /> : <PlayCircle className="w-6 h-6 text-white" />}
                                                            </button>
                                                            <div>
                                                                <span className={`text-[9px] font-black ${style.text} uppercase tracking-widest`}>{mix.type}</span>
                                                                <h4 className="text-sm font-bold text-white uppercase italic tracking-tighter">{mix.title}</h4>
                                                                <p className="text-[10px] text-gray-500">{mix.duration} · {mix.uploadDate}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={handleShare}
                                                                className={`w-9 h-9 border border-white/10 bg-black/40 hover:${style.bgLight} rounded-xl flex items-center justify-center text-gray-400 hover:${style.text} transition-all`}
                                                                title="Partager"
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </button>
                                                            {mix.allowDownload && (
                                                                <button
                                                                    onClick={handleDownload}
                                                                    className={`w-9 h-9 border border-white/10 bg-black/40 hover:${style.bgLight} rounded-xl flex items-center justify-center text-gray-400 hover:${style.text} transition-all hidden md:flex`}
                                                                    title="Télécharger"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isPlaying && mix.audioUrl && (
                                                        <div className={`mt-3 h-1 rounded-full ${style.bgLight} overflow-hidden`}>
                                                            <div className={`h-full ${style.bg} animate-pulse w-1/3 rounded-full`} />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <Headphones className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Aucun mix public</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 sm:p-8">
                                {profile.reviews && profile.reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {profile.reviews.map((review: any) => (
                                            <div key={review.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-black text-white uppercase">{review.festival}</h4>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-400 italic border-l-2 border-yellow-500/30 pl-3">"{review.text}"</p>
                                                <p className="text-[8px] text-gray-600 font-bold uppercase mt-2">{review.date}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Aucun avis publié</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>

            </div>
        </div>
    );
}

export default PublicProfile;
