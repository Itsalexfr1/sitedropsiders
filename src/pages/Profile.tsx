import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Shield, Trophy, Music, Calendar, Settings, LogOut, Check, X, Bell, Zap, Edit2, PlayCircle, UploadCloud, Headphones, Download, DownloadCloud, Share2, MessageSquare, Star, Send, Instagram, ArrowLeftRight, BarChart2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUser, type DropsidersCard } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { MixUploadModal } from '../components/profile/MixUploadModal';
import { MixStatsPanel } from '../components/profile/MixStatsPanel';
import wikiFestivals from '../data/wiki_festivals.json';
import wikiClubs from '../data/wiki_clubs.json';
import { DropsidersCardComponent } from '../components/cards/DropsidersCard';
import { UserAuthModal } from '../components/auth/UserAuthModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CardPrintOrderModal } from '../components/cards/CardPrintOrderModal';
import { CardTradeModal } from '../components/cards/CardTradeModal';
import { TradeInboxPanel } from '../components/cards/TradeInboxPanel';


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

export function Profile() {
    const { user, updateUser, logout, isLoggedIn, showNotification, deleteAccount, collectedCards, claimHandle } = useUser();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState(user?.username || '');
    const [instagram, setInstagram] = useState(user?.instagram || '');
    const [userHandle, setUserHandle] = useState(user?.handle || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [activeTab, setActiveTab ] = useState<'overview' | 'mixes' | 'reviews' | 'settings' | 'favorites' | 'collection' | 'trades'>('overview');
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isTradeInboxOpen, setIsTradeInboxOpen] = useState(false);
    const [initialTradeCard, setInitialTradeCard] = useState<DropsidersCard | null>(null);

    useEffect(() => {
        if (user?.handle) {
            setUserHandle(user.handle);
        }
    }, [user?.handle]);
    const [uploadType, setUploadType] = useState<'Track' | 'Remix' | 'Edit' | 'Mix'>('Mix');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [selectedFestival, setSelectedFestival] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [customFestivalImage, setCustomFestivalImage] = useState<File | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [userMixes, setUserMixes] = useState<any[]>([]);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mixStudioTab, setMixStudioTab] = useState<'mixes' | 'stats'>('mixes');
    const { activeTrack, playTrack, closePlayer } = usePlayer();
    const [pendingPlayId, setPendingPlayId] = useState<string | null>(null);

    const [cardSearch, setCardSearch] = useState('');
    const [cardRarityFilter, setCardRarityFilter] = useState<'all' | 'legendary' | 'epic' | 'rare' | 'common'>('all');
    const [cardTypeFilter, setCardTypeFilter] = useState<'all' | 'festival' | 'club' | 'dj'>('all');
    const [selectedCardForPreview, setSelectedCardForPreview] = useState<DropsidersCard | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Group collected cards by ID to show quantities
    const groupedCards = (collectedCards || []).reduce((acc, card) => {
        if (!acc[card.id]) {
            acc[card.id] = { card, count: 0 };
        }
        acc[card.id].count += 1;
        return acc;
    }, {} as Record<string, { card: typeof collectedCards[0]; count: number }>);

    const uniqueCardsList = Object.values(groupedCards);

    const filteredCards = uniqueCardsList.filter(({ card }) => {
        const matchesSearch = card.name.toLowerCase().includes(cardSearch.toLowerCase()) ||
            card.city.toLowerCase().includes(cardSearch.toLowerCase()) ||
            card.country.toLowerCase().includes(cardSearch.toLowerCase());
        const matchesRarity = cardRarityFilter === 'all' || card.rarity === cardRarityFilter;
        const matchesType = cardTypeFilter === 'all' || card.type === cardTypeFilter;
        return matchesSearch && matchesRarity && matchesType;
    });

    useEffect(() => {
        if (user?.email) {
            // Load mixes from KV
            fetch(`/api/user/mixes?email=${encodeURIComponent(user.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setUserMixes(data);
                })
                .catch(err => console.error("Failed to load mixes", err));
        }
    }, [isLoggedIn, navigate, user?.email]);

    const location = useLocation();

    // On mount: read URL params ?tab=mixes&play=<mixId> (set by community redirects)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const playParam = params.get('play');
        if (tabParam === 'mixes') {
            setActiveTab('mixes');
        }
        if (playParam) {
            setPendingPlayId(playParam);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // Once userMixes loads, resolve pendingPlayId and autoplay
    useEffect(() => {
        if (!pendingPlayId) return;
        // Search in user's own mixes first
        const ownMix = userMixes.find((m: any) => m.id === pendingPlayId);
        if (ownMix) {
            playTrack({
                id: ownMix.id,
                title: ownMix.title,
                artist: ownMix.username || user?.username || 'Dropsider',
                label: ownMix.genre || ownMix.type,
                url: ownMix.audioUrl || ownMix.url || '',
                embedUrl: ownMix.embedUrl && !ownMix.audioUrl ? ownMix.embedUrl : undefined,
                tracks: ownMix.tracklist || [],
            });
            setPendingPlayId(null);
            return;
        }
        // If not found AND userMixes already loaded, search community mixes
        if (userMixes.length > 0 || !user?.email) {
            fetch('/api/community/mixes')
                .then(r => r.json())
                .then((mixes: any[]) => {
                    const communityMix = mixes.find((m: any) => m.id === pendingPlayId);
                    if (communityMix) {
                        playTrack({
                            id: communityMix.id,
                            title: communityMix.title,
                            artist: communityMix.username || 'Dropsider',
                            label: communityMix.genre || communityMix.type,
                            url: communityMix.audioUrl || communityMix.url || '',
                            embedUrl: communityMix.embedUrl && !communityMix.audioUrl ? communityMix.embedUrl : undefined,
                            tracks: communityMix.tracklist || [],
                        });
                    }
                })
                .catch(() => {})
                .finally(() => setPendingPlayId(null));
        }
    }, [pendingPlayId, userMixes, user?.email, playTrack]);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // No early return, we handle UI status below

    const handleUpdateName = async () => {
        const updates: any = {};
        if (username.trim() && username !== user?.username) updates.username = username.trim();
        if (instagram.trim() !== (user?.instagram || '')) updates.instagram = instagram.trim();
        
        if (Object.keys(updates).length > 0) {
            updateUser(updates);
            showNotification('Profil mis à jour !', 'success');
        }

        if (userHandle.trim() && userHandle.trim() !== user?.handle) {
            const claimRes = await claimHandle(userHandle.trim());
            if (!claimRes.success) {
                showNotification(claimRes.error || 'Erreur lors de la réservation du handle', 'error');
                return;
            }
        }
        setIsEditingName(false);
    };

    const handleDeleteMix = async (id: string) => {
        const mixToDelete = userMixes.find(m => m.id === id);
        if (!mixToDelete) return;

        try {
            // 1. Delete from Metadata (KV)
            const resMeta = await fetch(`/api/user/mixes?email=${encodeURIComponent(user?.email || '')}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': localStorage.getItem('dropsiders_admin_password') || '',
                    'X-Admin-Username': localStorage.getItem('dropsiders_admin_username') || ''
                },
                body: JSON.stringify({ id })
            });

            if (resMeta.ok) {
                // 2. Delete from Cloud (R2)
                if (mixToDelete.audioKey) {
                    await fetch('/api/r2/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Admin-Password': localStorage.getItem('dropsiders_admin_password') || '',
                            'X-Admin-Username': localStorage.getItem('dropsiders_admin_username') || ''
                        },
                        body: JSON.stringify({ key: mixToDelete.audioKey })
                    });
                }

                setUserMixes(prev => prev.filter(m => m.id !== id));
                showNotification('Contenu supprimé avec succès.', 'success');
            } else {
                const err = await resMeta.json();
                showNotification(err.error || 'Erreur lors de la suppression', 'error');
            }
        } catch (e: any) {
            console.error(e);
            showNotification(e.message || 'Erreur réseau', 'error');
        }
    };

    const handleAvatarSuccess = (url: string | string[]) => {
        const avatarUrl = Array.isArray(url) ? url[0] : url;
        updateUser({ avatar: avatarUrl });
        showNotification('Avatar mis à jour !', 'success');
        setIsAvatarModalOpen(false);
    };

    const handleShareProfile = async () => {
        const link = `${window.location.origin}/profil/${encodeURIComponent(user?.username || '')}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Profil de ${user?.username || 'Utilisateur'} - DROPSIDERS`,
                    url: link
                });
            } catch (err) {
                console.error("Partage annulé");
            }
        } else {
            await navigator.clipboard.writeText(link);
            showNotification("Lien du profil copié !", 'success');
        }
    };

    const stats = [
        { label: 'DROPS', value: user?.drops || 0, icon: <Zap className="w-5 h-5 text-neon-cyan" />, color: 'from-neon-cyan/20 to-transparent' },
        { label: 'RANG', value: 'MEMBRE', icon: <Shield className="w-5 h-5 text-neon-red" />, color: 'from-neon-red/20 to-transparent' },
        { label: 'XP', value: user?.xp || 0, icon: <Trophy className="w-5 h-5 text-amber-500" />, color: 'from-amber-500/20 to-transparent' },
        { label: 'FAVORIS', value: user?.agendaFavorites?.length || 0, icon: <Calendar className="w-5 h-5 text-neon-cyan" />, color: 'from-neon-cyan/20 to-transparent' }
    ];

    const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);
    useEffect(() => {
        if (user?.agendaFavorites && user.agendaFavorites.length > 0) {
            fetch('/api/agenda')
                .then(res => res.json())
                .then(data => {
                    const favs = data.filter((e: any) => user.agendaFavorites.includes(e.id));
                    setFavoriteEvents(favs);
                })
                .catch(err => console.error(err));
        }
    }, [user?.agendaFavorites]);

    const handleRequestAccess = async () => {
        if (!user?.email) return;
        
        try {
            const res = await fetch('/api/user/request-mix-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            
            if (res.ok) {
                // Update local user state
                updateUser({ mixStatus: 'pending' } as any);
                showNotification("Demande envoyée aux administrateurs.", 'success');
            } else {
                showNotification("Erreur lors de l'envoi de la demande.", 'error');
            }
        } catch (e) {
            showNotification("Erreur réseau.", 'error');
        }
    };

    const getEventColor = (genre: string, type: string) => {
        const g = (genre || '').toLowerCase().trim();
        const t = (type || '').toLowerCase().trim();
        if (g.includes('musique') || g.includes('music')) return 'neon-green';
        if (t === 'festival' || g.includes('techno') || g.includes('hybride') || g.includes('hardcore')) return 'neon-red';
        if (g.includes('house') || g.includes('tech house')) return 'neon-blue';
        if (g.includes('melodic') || t === 'jeux concours') return 'neon-yellow';
        if (g.includes('big room')) return 'neon-purple';
        if (g.includes('hard techno')) return 'neon-fuchsia';
        if (g.includes('drum')) return 'neon-green';
        if (g.includes('bass music')) return 'neon-lime';
        if (g.includes('dubstep')) return 'neon-indigo';
        if (g.includes('afro house')) return 'neon-amber';
        if (g.includes('indie dance')) return 'neon-sky';
        if (g.includes('multi styles')) return 'neon-emerald';
        if (g.includes('trance') || t === 'concert') return 'neon-cyan';
        return 'neon-red';
    };

    return (
        <>
            <div className={twMerge(
                "min-h-screen bg-[#050505] pt-32 pb-20 px-6 relative transition-all duration-700",
                !isLoggedIn && "blur-[40px] pointer-events-none select-none overflow-hidden max-h-screen"
            )}>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-neon-red/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-neon-red/5 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Sidebar: Hero Profile */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-red shadow-[0_0_10px_rgba(255,0,51,0.5)]" />
                            
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="relative group/avatar">
                                    <div className="w-40 h-40 rounded-[40px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-1 relative overflow-hidden shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover rounded-[36px]" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-[36px]">
                                                <User className="w-16 h-16 text-gray-700" />
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => setIsAvatarModalOpen(true)}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all duration-300"
                                        >
                                            <Camera className="w-8 h-8 text-white" />
                                        </button>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-neon-red rounded-2xl flex items-center justify-center shadow-lg shadow-neon-red/30 border border-white/20">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                <div className="space-y-4 w-full">
                                    {isEditingName ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    value={username} 
                                                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                                                    className="w-full bg-black/40 border-2 border-neon-red rounded-2xl px-4 py-3 text-white font-display font-black uppercase italic outline-none"
                                                    placeholder="PSEUDO"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-full">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">@</span>
                                                    <input 
                                                        type="text" 
                                                        value={userHandle} 
                                                        onChange={(e) => setUserHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-8 pr-4 py-3 text-white font-bold outline-none focus:border-neon-cyan transition-all"
                                                        placeholder="HANDLE"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-full">
                                                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input 
                                                        type="text" 
                                                        value={instagram} 
                                                        onChange={(e) => setInstagram(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white font-bold outline-none focus:border-neon-red transition-all"
                                                        placeholder="@INSTAGRAM"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleUpdateName} className="flex-1 py-3 bg-neon-green/20 text-neon-green rounded-xl hover:bg-neon-green/40 transition-all font-black text-[10px] uppercase">Enregistrer</button>
                                                <button onClick={() => setIsEditingName(false)} className="px-4 py-3 bg-white/5 text-gray-500 rounded-xl hover:bg-white/10 transition-all font-black text-[10px] uppercase">Annuler</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center justify-center gap-3">
                                                <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">{user?.username}</h1>
                                                <button onClick={() => setIsEditingName(true)} className="p-2 text-gray-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            </div>
                                            {user?.handle && (
                                                <p className="text-xs text-neon-cyan font-bold">@{user.handle}</p>
                                            )}
                                            {user?.instagram && (
                                                <a 
                                                    href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/10 rounded-full hover:scale-105 transition-all group"
                                                >
                                                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                                                    <span className="text-[10px] font-black text-white/60 group-hover:text-white transition-colors">{user.instagram.startsWith('@') ? user.instagram : `@${user.instagram}`}</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Membre depuis {user ? (new Date(user.createdAt)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '...'}</p>
                                </div>

                                <div className="pt-6 w-full border-t border-white/5 flex flex-col gap-3">
                                    <button onClick={handleShareProfile} className="flex items-center justify-center gap-3 w-full py-4 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan rounded-2xl font-black uppercase tracking-widest transition-all text-xs group">
                                        <Share2 className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> Partager mon profil
                                    </button>
                                    <button onClick={() => logout()} className="flex items-center justify-center gap-3 w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-2xl font-black uppercase tracking-widest transition-all text-xs group">
                                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Se déconnecter
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className={`p-6 bg-white/5 border border-white/10 rounded-[32px] bg-gradient-to-br ${stat.color} backdrop-blur-md`}>
                                    <div className="mb-3">{stat.icon}</div>
                                    <p className="text-2xl font-display font-black text-white italic leading-none mb-1">{stat.value}</p>
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content: Tabs & Details */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Modern Tab Navigation */}
                        <div className="sticky top-16 lg:static z-30 -mx-6 px-6 lg:mx-0 lg:px-0 py-4 lg:py-0 bg-[#050505]/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none mb-8">
                            <div className="relative p-1.5 bg-white/[0.03] border border-white/10 rounded-[2rem] backdrop-blur-2xl flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth w-full lg:w-fit">
                                {[
                                    { id: 'overview', label: 'Vue d\'ensemble', icon: User, color: 'text-neon-cyan' },
                                    { id: 'collection', label: 'Ma Collection', icon: Trophy, color: 'text-amber-500' },
                                    { id: 'trades', label: 'Échanges', icon: ArrowLeftRight, color: 'text-neon-cyan' },
                                    { id: 'mixes', label: 'Mix Studio', icon: Headphones, color: 'text-neon-purple' },
                                    { id: 'reviews', label: 'Avis & Notes', icon: MessageSquare, color: 'text-yellow-500' },
                                    { id: 'favorites', label: 'Favoris', icon: Music, color: 'text-neon-red' },
                                    { id: 'settings', label: 'Sécurité', icon: Settings, color: 'text-gray-400' }
                                ].map(tab => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={twMerge(
                                                "relative flex items-center gap-3 px-6 py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shrink-0 group",
                                                isActive 
                                                    ? "text-black bg-white shadow-[0_10px_30px_rgba(255,255,255,0.2)]" 
                                                    : "text-gray-500 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <tab.icon className={twMerge(
                                                "w-4 h-4 transition-transform duration-500",
                                                isActive ? "text-black scale-110" : `${tab.color} group-hover:scale-110`
                                            )} />
                                            <span className="relative z-10">{tab.label}</span>
                                            
                                            {/* Glow for inactive tabs on hover */}
                                            {!isActive && (
                                                <div className="absolute inset-0 rounded-[1.2rem] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-white/[0.02] to-transparent" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
                                            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                                <div className="w-10 h-10 bg-neon-cyan/20 rounded-xl flex items-center justify-center">
                                                    <Bell className="w-5 h-5 text-neon-cyan" />
                                                </div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Activité Récente</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                                                    <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                                                    <div>
                                                        <p className="text-[11px] text-white font-bold uppercase">Profil créé</p>
                                                        <p className="text-[9px] text-gray-500 font-bold uppercase italic">Bienvenue dans la communauté !</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                         <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
                                             <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                                 <div className="w-10 h-10 bg-neon-red/20 rounded-xl flex items-center justify-center">
                                                     <Calendar className="w-5 h-5 text-neon-red" />
                                                 </div>
                                                 <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Mes Événements</h3>
                                             </div>
                                             
                                             <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                 {favoriteEvents.length > 0 ? (
                                                     favoriteEvents.map((event, idx) => {
                                                         const color = getEventColor(event.genre, event.type);
                                                         return (
                                                             <div key={idx} className={`p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-${color}/5 hover:border-${color}/30 transition-all`} onClick={() => navigate(`/agenda?event=${event.id}`)}>
                                                                 <div className="flex items-center gap-3">
                                                                     <div className={`w-10 h-10 rounded-lg overflow-hidden border border-${color}/20`}>
                                                                         <img src={event.image} alt="" className="w-full h-full object-cover" />
                                                                     </div>
                                                                     <div>
                                                                         <p className="text-[10px] text-white font-black uppercase truncate max-w-[120px]">{event.title}</p>
                                                                         <p className="text-[8px] text-gray-500 font-bold uppercase">{new Date(event.startDate || event.date).toLocaleDateString('fr-FR')}</p>
                                                                     </div>
                                                                 </div>
                                                                 <div className={`text-[9px] text-${color} font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity`}>Voir</div>
                                                             </div>
                                                         );
                                                     })
                                                 ) : (
                                                     <div className="text-center py-6">
                                                         <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Aucun événement enregistré</p>
                                                         <button onClick={() => navigate('/agenda')} className="mt-4 px-6 py-2 border border-neon-red/30 rounded-xl text-neon-red text-[9px] font-black uppercase tracking-widest hover:bg-neon-red/10 transition-all">Consulter l'agenda</button>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                    </div>
                                )}

                                {activeTab === 'collection' && (
                                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                                    <Trophy className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Ma Collection</h3>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                                        {new Set((collectedCards || []).map(c => c.id)).size} / {wikiFestivals.length + wikiClubs.length} CARTES UNIQUES
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-full sm:w-48 bg-white/5 border border-white/10 rounded-full h-3 overflow-hidden p-[2px]">
                                                <div 
                                                    className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (((new Set((collectedCards || []).map(c => c.id)).size) || 0) / (wikiFestivals.length + wikiClubs.length || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Filters bar */}
                                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-black/25 p-4 border border-white/5 rounded-2xl">
                                            {/* Search input */}
                                            <input 
                                                type="text"
                                                placeholder="Rechercher un festival, club, ville..."
                                                value={cardSearch}
                                                onChange={(e) => setCardSearch(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors w-full sm:w-64"
                                            />

                                            <div className="flex gap-2 items-center">
                                                {/* Rarity filter */}
                                                <select
                                                    value={cardRarityFilter}
                                                    onChange={(e) => setCardRarityFilter(e.target.value as any)}
                                                    className="bg-[#050505] border border-white/10 text-[9px] font-black text-white uppercase tracking-widest rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                                                >
                                                    <option value="all">Toutes Raretés</option>
                                                    <option value="legendary">Légendaire</option>
                                                    <option value="epic">Épique</option>
                                                    <option value="rare">Rare</option>
                                                    <option value="common">Commun</option>
                                                </select>

                                                {/* Type filter */}
                                                <select
                                                    value={cardTypeFilter}
                                                    onChange={(e) => setCardTypeFilter(e.target.value as any)}
                                                    className="bg-[#050505] border border-white/10 text-[9px] font-black text-white uppercase tracking-widest rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                                                >
                                                    <option value="all">Tous Types</option>
                                                    <option value="festival">Festival</option>
                                                    <option value="club">Club</option>
                                                    <option value="dj">DJ</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Cards grid */}
                                        {filteredCards.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
                                                {filteredCards.map(({ card, count }) => (
                                                    <div key={card.id} className="relative group">
                                                        {count > 1 && (
                                                            <div className="absolute top-2 left-2 z-40 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                                                x{count}
                                                            </div>
                                                        )}
                                                        <DropsidersCardComponent
                                                            card={card}
                                                            scale={0.9}
                                                            onClick={() => setSelectedCardForPreview(card)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 opacity-65 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                <Trophy className="w-10 h-10 mx-auto mb-4 text-gray-600 animate-pulse" />
                                                <p className="text-xs text-gray-400 uppercase font-black tracking-[0.2em] mb-2">Aucune carte ne correspond.</p>
                                                <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                                                    Chaque jour, passe plus de 5 minutes sur le site pour remporter une carte unique de festival ou club !
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                 {activeTab === 'trades' && (
                                     <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
                                         <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                             <div className="w-10 h-10 bg-neon-cyan/20 rounded-xl flex items-center justify-center">
                                                 <ArrowLeftRight className="w-5 h-5 text-neon-cyan" />
                                             </div>
                                             <div>
                                                 <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Mes Échanges</h3>
                                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Proposer et gérer vos offres d'échange</p>
                                             </div>
                                         </div>

                                         <div className="p-10 border-2 border-dashed border-white/10 rounded-[32px] text-center space-y-6">
                                             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                                 <ArrowLeftRight className="w-8 h-8 text-neon-cyan" />
                                             </div>
                                             <div className="space-y-2">
                                                 <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Échanger des Cartes</h4>
                                                 <p className="text-[10px] text-gray-500 font-bold uppercase italic max-w-xs mx-auto leading-relaxed">
                                                     Proposez des échanges à d'autres membres en recherchant leur handle unique (@handle) ou consultez vos offres en attente.
                                                 </p>
                                             </div>
                                             <div className="flex flex-col sm:flex-row justify-center gap-3">
                                                 <button
                                                     onClick={() => setIsTradeModalOpen(true)}
                                                     className="px-6 py-4 bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 active:scale-95 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
                                                 >
                                                     Proposer un Échange
                                                 </button>
                                                 <button
                                                     onClick={() => setIsTradeInboxOpen(true)}
                                                     className="px-6 py-4 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
                                                 >
                                                     Ouvrir l'Inbox d'Échanges
                                                 </button>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                {activeTab === 'mixes' && (
                                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                                                    <Headphones className="w-5 h-5 text-neon-purple" />
                                                </div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Mix Studio</h3>
                                            </div>
                                            {(user?.mixStatus === 'approved' || localStorage.getItem('admin_auth_v2') === 'true') && (
                                                <div className="flex gap-1 p-1 bg-black/40 border border-white/10 rounded-xl">
                                                    <button
                                                        onClick={() => setMixStudioTab('mixes')}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            mixStudioTab === 'mixes' ? 'bg-neon-purple text-white shadow-[0_0_10px_rgba(188,19,254,0.4)]' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        <Headphones className="w-3 h-3" /> Mixes
                                                    </button>
                                                    <button
                                                        onClick={() => setMixStudioTab('stats')}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            mixStudioTab === 'stats' ? 'bg-neon-cyan text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        <BarChart2 className="w-3 h-3" /> Stats
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {mixStudioTab === 'stats' && (user?.mixStatus === 'approved' || localStorage.getItem('admin_auth_v2') === 'true') ? (
                                            <MixStatsPanel userEmail={user?.email || ''} />
                                        ) : (
                                        <>
                                        {user?.mixStatus === 'approved' || localStorage.getItem('admin_auth_v2') === 'true' ? (
                                            <>
                                                <div className="flex gap-2 justify-center mb-6">
                                                    {['Track', 'Remix', 'Edit', 'Mix'].map(type => {
                                                        const style = getCategoryStyle(type);
                                                        return (
                                                            <button 
                                                                key={type}
                                                                onClick={() => setUploadType(type as any)}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === type ? `${style.bg} ${style.selectedText} ${style.shadow}` : 'bg-white/5 text-gray-500 hover:text-white border border-white/10'}`}
                                                            >
                                                                {type}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {(() => {
                                                    const style = getCategoryStyle(uploadType);
                                                    return (
                                                        <div className={`p-8 border-2 border-dashed ${style.borderDashed} ${style.bgBg} rounded-[32px] text-center ${style.hoverBg} ${style.hoverBorder} transition-all cursor-pointer group flex flex-col items-center gap-4 relative overflow-hidden`}>
                                                            <input 
                                                                type="file" 
                                                                accept="audio/mpeg" 
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        if (file.size > 150 * 1024 * 1024) {
                                                                            showNotification("Le fichier est trop volumineux. La limite est de 150 Mo.", 'error');
                                                                            return;
                                                                        }
                                                                        setSelectedAudioFile(file);
                                                                        setIsUploadModalOpen(true);
                                                                    }
                                                                }}
                                                            />
                                                            <UploadCloud className={`w-12 h-12 ${style.textMuted} ${style.groupHoverText} transition-colors group-hover:-translate-y-1 transform duration-300`} />
                                                            <div>
                                                                <p className={`text-xs font-black text-white uppercase tracking-widest mb-1 ${style.groupHoverText} transition-colors`}>Uploader un nouveau {uploadType}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase italic">Format MP3 uniquement - Max 150 Mo</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        ) : (
                                            <div className="p-10 border-2 border-dashed border-white/10 rounded-[32px] text-center space-y-6">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                                    <Shield className="w-8 h-8 text-gray-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Accès Restreint</h4>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase italic max-w-xs mx-auto leading-relaxed">
                                                        L'ajout de mixes au Studio est réservé aux membres autorisés par l'équipe Dropsiders.
                                                     </p>
                                                </div>
                                                
                                                {user?.mixStatus === 'pending' ? (
                                                    <div className="px-6 py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] inline-block">
                                                        Demande en cours d'examen...
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={handleRequestAccess}
                                                        className="px-8 py-4 bg-neon-purple/10 hover:bg-neon-purple text-neon-purple hover:text-white border border-neon-purple/30 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(191,0,255,0.1)] hover:shadow-neon-purple/30 active:scale-95"
                                                    >
                                                        Demander l'accès au Studio
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Mes Mixes Publics</h4>
                                            
                                            {/* Active Player has been moved to Global Container */}

                                            {/* Mix Cards List */}
                                            {userMixes.length > 0 ? (
                                                <div className="space-y-4">
                                                    {userMixes.map((mix) => {
                                                        const style = getCategoryStyle(mix.type);
                                                        const isActive = activeTrack?.id === mix.id;
                                                        return (
                                                            <motion.div
                                                                key={mix.id}
                                                                layout
                                                                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                                                                    isActive
                                                                        ? `border-${style.colorName}/40 bg-gradient-to-r from-${style.colorName}/10 to-transparent shadow-[0_0_30px_rgba(0,0,0,0.3)]`
                                                                        : 'border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]'
                                                                }`}
                                                                onClick={() => {
                                                                    if (isActive) {
                                                                        closePlayer();
                                                                    } else {
                                                                        playTrack({
                                                                            id: mix.id,
                                                                            title: mix.title,
                                                                            artist: mix.username || user?.username || 'Dropsider',
                                                                            label: mix.genre || mix.type,
                                                                            url: mix.audioUrl || mix.url || '',
                                                                            embedUrl: mix.embedUrl && !mix.audioUrl ? mix.embedUrl : undefined,
                                                                            tracks: mix.tracklist || [],
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                {/* Glow accent bar */}
                                                                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${style.bg} transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />

                                                                <div className="flex items-center gap-4 p-4 pl-5">
                                                                    {/* Play button */}
                                                                    <button
                                                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                                                                            isActive
                                                                                ? `${style.bg} text-black shadow-[0_0_20px_rgba(0,0,0,0.3)]`
                                                                                : `${style.bgLight} ${style.text} group-hover:scale-110`
                                                                        }`}
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            if (isActive) {
                                                                                closePlayer();
                                                                            } else {
                                                                                playTrack({
                                                                                    id: mix.id,
                                                                                    title: mix.title,
                                                                                    artist: mix.username || user?.username || 'Dropsider',
                                                                                    label: mix.genre || mix.type,
                                                                                    url: mix.audioUrl || mix.url || '',
                                                                                    embedUrl: mix.embedUrl && !mix.audioUrl ? mix.embedUrl : undefined,
                                                                                    tracks: mix.tracklist || [],
                                                                                });
                                                                            }
                                                                        }}
                                                                    >
                                                                        {isActive
                                                                            ? <span className="flex gap-[3px] items-end h-4">
                                                                                {[1,2,3].map(i => (
                                                                                    <span key={i} className="w-[3px] bg-black rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }} />
                                                                                ))}
                                                                              </span>
                                                                            : <PlayCircle className="w-5 h-5" />
                                                                        }
                                                                    </button>

                                                                    {/* Metadata */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <span className={`text-[9px] font-black ${style.text} uppercase tracking-[0.2em] px-2 py-0.5 ${style.bgLight} rounded-md`}>{mix.type}</span>
                                                                            {mix.genre && <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{mix.genre}</span>}
                                                                        </div>
                                                                        <h5 className="text-sm font-black text-white uppercase italic tracking-tight truncate">{mix.title}</h5>
                                                                        <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">{mix.duration || '—'} · {mix.uploadDate}</p>
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {mix.allowDownload && mix.audioUrl && (
                                                                            <a
                                                                                href={mix.audioUrl}
                                                                                download={`${mix.title}.mp3`}
                                                                                className={`w-9 h-9 border ${style.borderLight} ${style.bgBg} rounded-xl flex items-center justify-center ${style.text} hover:${style.bgLight} transition-all`}
                                                                                title="Télécharger"
                                                                                onClick={e => e.stopPropagation()}
                                                                            >
                                                                                <DownloadCloud className="w-4 h-4" />
                                                                            </a>
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setDeleteTargetId(mix.id); }}
                                                                            className="w-9 h-9 border border-red-500/10 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/30 rounded-xl flex items-center justify-center text-red-500 transition-all"
                                                                            title="Supprimer"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 opacity-50 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                    <Headphones className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Aucun mix mis en ligne pour le moment.</p>
                                                </div>
                                            )}
                                        </div>
                                        </>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-yellow-500" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Rédiger un Avis</h3>
                                        </div>
                                        
                                        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-4">
                                            <div className="relative">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Festival / Événement</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Ex: Tomorrowland 2026, Afterlife Paris..." 
                                                    value={selectedFestival}
                                                    onChange={(e) => {
                                                        setSelectedFestival(e.target.value);
                                                        setShowSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowSuggestions(true)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors"
                                                />
                                                {showSuggestions && selectedFestival && (
                                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl backdrop-blur-xl">
                                                        {wikiFestivals.filter(f => f.name.toLowerCase().includes(selectedFestival.toLowerCase())).length > 0 ? (
                                                            wikiFestivals.filter(f => f.name.toLowerCase().includes(selectedFestival.toLowerCase())).map(f => (
                                                                <button
                                                                    key={f.id}
                                                                    onClick={() => {
                                                                        setSelectedFestival(f.name);
                                                                        setShowSuggestions(false);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 hover:bg-yellow-500/10 hover:text-yellow-500 text-gray-300 text-sm font-bold uppercase transition-colors"
                                                                >
                                                                    {f.name}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-xs text-gray-400 italic">
                                                                Nouveau festival. Une photo sera requise !
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {selectedFestival && !wikiFestivals.some(f => f.name.toLowerCase() === selectedFestival.toLowerCase()) && (
                                                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-3">
                                                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Camera className="w-3 h-3" /> Festival Inconnu
                                                    </p>
                                                    <p className="text-xs text-gray-400">Ce festival n'est pas dans notre base de données. Ajoute une photo du festival pour qu'il soit validé.</p>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setCustomFestivalImage(e.target.files[0]);
                                                            }
                                                        }}
                                                        className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-yellow-500/20 file:text-yellow-500 hover:file:bg-yellow-500/30 transition-all cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                            
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Ta Note</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button 
                                                            key={star} 
                                                            onClick={() => setReviewRating(star)}
                                                            className="p-1 hover:scale-110 transition-transform"
                                                        >
                                                            <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-gray-600'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Ton Avis Détaillé</label>
                                                <textarea 
                                                    rows={4}
                                                    placeholder="L'organisation était top, le son incroyable..."
                                                    value={reviewText}
                                                    onChange={(e) => setReviewText(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                                                />
                                            </div>

                                            <button 
                                                onClick={async () => {
                                                    if (!selectedFestival || !reviewRating || !reviewText) {
                                                        showNotification("Merci de remplir tous les champs !", 'error');
                                                        return;
                                                    }
                                                    if (!wikiFestivals.some(f => f.name.toLowerCase() === selectedFestival.toLowerCase())) {
                                                        if (!customFestivalImage) {
                                                            showNotification("Ce festival n'est pas répertorié. Vous devez ajouter une photo du festival pour l'envoyer !", 'error');
                                                            return;
                                                        }
                                                    }
                                                    try {
                                                        const res = await fetch('/api/avis/submit', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                festival: selectedFestival,
                                                                ratings: {
                                                                    organization: reviewRating,
                                                                    sound: reviewRating,
                                                                    food: reviewRating
                                                                },
                                                                comment: reviewText,
                                                                tips: '',
                                                                author: user?.username || 'Anonyme'
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            showNotification("Avis envoyé avec succès ! Il apparaîtra sur la page Communauté.", 'success');
                                                            setReviewRating(0);
                                                            setReviewText('');
                                                            setSelectedFestival('');
                                                        } else {
                                                            showNotification("Erreur lors de la soumission de l'avis.", 'error');
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        showNotification("Erreur réseau.", 'error');
                                                    }
                                                }}
                                                className="w-full py-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-500 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all group"
                                            >
                                                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> Publier Cet Avis
                                            </button>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Historique de mes avis</h4>
                                            
                                            <div className="text-center py-10 opacity-50 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Aucun avis publié pour le moment.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'favorites' && (
                                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 text-center">
                                        <div className="w-20 h-20 bg-neon-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Music className="w-10 h-10 text-neon-red" />
                                        </div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter mb-4">Ta Playlist Dropsiders</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest max-w-sm mx-auto mb-8">Retrouve ici tous les titres que tu as likés pendant les Takeovers et lives.</p>
                                        <button onClick={() => navigate('/live')} className="px-10 py-4 bg-neon-red text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-neon-red/20 hover:scale-105 transition-all">Rejoindre le Live</button>
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                            <div className="w-10 h-10 bg-neon-red/20 rounded-xl flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-neon-red" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Sécurité du Compte</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-3xl transition-all hover:border-white/10">
                                                <div>
                                                    <p className="text-xs font-black text-white uppercase tracking-widest mb-1">MIME TYPE SESSION</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Technologie de stockage : LocalStorage (Chiffré)</p>
                                                </div>
                                                <div className="px-4 py-1.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded-lg uppercase border border-green-500/30">Activé</div>
                                            </div>
                                        </div>

                                        <div className="p-8 border-2 border-dashed border-red-500/20 rounded-[32px] text-center space-y-4">
                                            <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em]">Zone de Danger</p>
                                            <p className="text-xs text-gray-600 font-medium italic">La suppression de votre profil est irréversible et effacera tous vos scores, mixes et favoris.</p>
                                            <button 
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="px-8 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Supprimer mon compte
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <ImageUploadModal 
                isOpen={isAvatarModalOpen} 
                onClose={() => setIsAvatarModalOpen(false)} 
                onUploadSuccess={handleAvatarSuccess}
                aspect={1}
                accentColor="neon-red"
            />

            <MixUploadModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                file={selectedAudioFile}
                type={uploadType}
                onSuccess={(data) => {
                    setUserMixes(prev => [data, ...prev]);
                    // Logic to actually save to DB could go here
                }}
            />

            <ConfirmationModal
                isOpen={deleteTargetId !== null}
                title="Supprimer ce mix ?"
                message="Es-tu sûr de vouloir supprimer ce contenu du Studio Dropsiders et du Cloud ? Cette action est irréversible."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={() => {
                    if (deleteTargetId) handleDeleteMix(deleteTargetId);
                    setDeleteTargetId(null);
                }}
                onCancel={() => setDeleteTargetId(null)}
                accentColor="neon-red"
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                title="Supprimer mon compte ?"
                message="Es-tu sûr de vouloir supprimer définitivement ton compte Dropsiders ? Toutes tes données (XP, Drops, Mixes, Favoris) seront effacées. Cette action est irréversible."
                confirmLabel="Supprimer définitivement"
                cancelLabel="Annuler"
                onConfirm={async () => {
                    const success = await deleteAccount();
                    if (success) {
                        navigate('/');
                    }
                    setShowDeleteConfirm(false);
                }}
                onCancel={() => setShowDeleteConfirm(false)}
                accentColor="neon-red"
            />
            </div>

            {!isLoggedIn && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm cursor-pointer"
                    onClick={() => navigate('/')}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-md w-full bg-[#050510]/80 border-2 border-white/10 rounded-[3rem] p-10 md:p-14 text-center space-y-10 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden cursor-default"
                    >
                        {/* Glows */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-red/20 rounded-full blur-[80px] animate-pulse" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neon-cyan/20 rounded-full blur-[80px] animate-pulse" />

                        <div className="relative space-y-6">
                            <div className="w-24 h-24 bg-neon-red/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-neon-red/20 shadow-[0_0_30px_rgba(255,0,51,0.2)]">
                                <LogOut className="w-10 h-10 text-neon-red shadow-[0_0_20px_rgba(255,0,51,0.5)]" />
                            </div>
                            
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-4xl font-display font-black text-white italic uppercase tracking-tighter leading-none">
                                    SESSION <span className="text-neon-red">TERMINÉE</span>
                                </h2>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">
                                    Vous avez été déconnecté. Reconnectez-vous pour accéder à votre profil et vos statistiques.
                                </p>
                            </div>

                            <div className="pt-6 space-y-4">
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-neon-red hover:text-white transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
                                >
                                    Me reconnecter
                                </button>
                                <div className="pt-6 border-t border-white/5">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-[0.4em] transition-all"
                                    >
                                        ← Retour sur le site
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <UserAuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />

            {/* FULLSCREEN CARD PREVIEW MODAL */}
            <AnimatePresence>
                {selectedCardForPreview && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCardForPreview(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative z-10 flex flex-col items-center gap-6"
                        >
                            {/* Card with scale 1.4 for fullscreen visibility */}
                            <DropsidersCardComponent
                                card={selectedCardForPreview}
                                flippable={true}
                                scale={1.4}
                            />

                            {/* Info & controls under the card */}
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
                                    Clique sur la carte pour la retourner
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-2">
                                    <button
                                        onClick={() => {
                                            setInitialTradeCard(selectedCardForPreview);
                                            setSelectedCardForPreview(null);
                                            setIsTradeModalOpen(true);
                                        }}
                                        className="px-6 py-2.5 bg-neon-cyan/20 hover:bg-neon-cyan/30 border border-neon-cyan/20 text-neon-cyan rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        <ArrowLeftRight className="w-3.5 h-3.5" /> Échanger cette carte
                                    </button>
                                    <button
                                        onClick={() => setIsPrintModalOpen(true)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-neon-red via-purple-600 to-neon-cyan hover:shadow-[0_0_20px_rgba(255,0,51,0.4)] text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                    >
                                        🖨️ Commander l'impression
                                    </button>
                                    <button
                                        onClick={() => setSelectedCardForPreview(null)}
                                        className="px-6 py-2.5 bg-white/10 hover:bg-white/25 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                    >
                                        Fermer la vue
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CardPrintOrderModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                card={selectedCardForPreview}
            />

            <CardTradeModal
                isOpen={isTradeModalOpen}
                onClose={() => {
                    setIsTradeModalOpen(false);
                    setInitialTradeCard(null);
                }}
                initialOfferedCard={initialTradeCard || undefined}
            />

            <TradeInboxPanel
                isOpen={isTradeInboxOpen}
                onClose={() => setIsTradeInboxOpen(false)}
            />
        </>
    );
}

export default Profile;
