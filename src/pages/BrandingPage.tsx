import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Instagram, 
    Facebook, 
    Globe, 
    ShoppingBag, 
    Radio, 
    Heart, 
    Sparkles, 
    Check, 
    ExternalLink, 
    Copy, 
    Newspaper, 
    Calendar, 
    Music, 
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/auth';

const TiktokIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
    </svg>
);

const SpotifyIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.4-2.1-10.6-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.7-1.1 8.7-.6 11.8 1.3.2.2.3.5.1.8zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-2-8.2-2.6-12-1.4-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 4.4-1.3 9.9-.7 13.6 1.6.3.3.4.8.1 1zM19.2 10.6c-3.9-2.3-10.3-2.5-14.1-1.4-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 4.3-1.3 11.4-1.1 16 1.6.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4v.1z" />
    </svg>
);

export function BrandingPage() {
    const [liveData, setLiveData] = useState<{ isLive: boolean; title?: string }>({ isLive: false });
    const [socialLikes, setSocialLikes] = useState<{ [key: string]: boolean }>({
        instagram: false,
        tiktok: false,
        facebook: false
    });
    const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({
        instagram: 14250,
        tiktok: 28900,
        facebook: 8310
    });
    const [copied, setCopied] = useState(false);

    // Fetch live status & restored likes from localStorage
    useEffect(() => {
        const fetchLiveStatus = async () => {
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    const takeover = data?.takeover;
                    if (takeover && (takeover.status === 'live' || takeover.enabled)) {
                        setLiveData({
                            isLive: true,
                            title: takeover.title || 'DROPSIDERS LIVE STREAM'
                        });
                    }
                }
            } catch (e) {
                console.error("Error loading live settings", e);
            }
        };

        fetchLiveStatus();

        const savedLikes = localStorage.getItem('dropsiders_social_likes');
        if (savedLikes) {
            try {
                const parsed = JSON.parse(savedLikes);
                setSocialLikes(parsed);
            } catch (e) {
                // ignore
            }
        }
    }, []);

    const toggleLike = (platform: string) => {
        setSocialLikes((prev) => {
            const nextState = !prev[platform];
            const updated = { ...prev, [platform]: nextState };
            localStorage.setItem('dropsiders_social_likes', JSON.stringify(updated));
            
            setLikeCounts((cPrev) => ({
                ...cPrev,
                [platform]: cPrev[platform] + (nextState ? 1 : -1)
            }));

            return updated;
        });
    };

    const copyPageLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-between p-4 sm:p-6 pt-20 pb-16 font-sans relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-red/15 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-neon-cyan/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-10 right-0 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
            </div>

            {/* Main Branding Card Content */}
            <main className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center gap-6">

                {/* Profile Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center text-center space-y-4 w-full"
                >
                    {/* Logo Avatar */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-red rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500 animate-gradient-x" />
                        <div className="relative w-28 h-28 rounded-full bg-[#0a0a0a] p-3 border-2 border-white/20 flex items-center justify-center shadow-2xl overflow-hidden">
                            <img 
                                src="/Logo.png" 
                                alt="DROPSIDERS Logo" 
                                className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,0,51,0.5)] transform group-hover:scale-105 transition-transform duration-300" 
                            />
                        </div>
                    </div>

                    {/* Title & Tagline */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider italic">
                                DROPSIDERS
                            </h1>
                            <span className="bg-neon-red/20 text-neon-red border border-neon-red/40 p-1 rounded-full text-xs" title="Officiel">
                                <Sparkles className="w-3.5 h-3.5" />
                            </span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4">
                            Culture Électro • Bass Music • Festivals & Nightlife
                        </p>
                    </div>

                    {/* Share Button */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={copyPageLink}
                            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white transition-all flex items-center gap-2 shadow-lg backdrop-blur-md active:scale-95"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-neon-cyan" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Lien copié !' : 'Partager la page'}
                        </button>
                    </div>
                </motion.div>

                {/* 🔴 DYNAMIC LIVE ACCESSIBLE BANNER (Visible only when live is active) */}
                <AnimatePresence>
                    {liveData.isLive && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="w-full"
                        >
                            <Link to="/live" className="block group">
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-neon-red to-red-900 border-2 border-neon-red p-4 shadow-[0_0_35px_rgba(255,0,51,0.5)] transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_0_50px_rgba(255,0,51,0.8)]">
                                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse" />
                                    
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-4 h-4 bg-white rounded-full animate-ping opacity-75" />
                                                <div className="absolute inset-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-neon-red rounded-full" />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] bg-black/40 px-2 py-0.5 rounded-full border border-white/20">
                                                    🔴 LIVE EN DIRECT
                                                </span>
                                                <h3 className="text-sm font-display font-black text-white uppercase tracking-tight mt-1 truncate max-w-[200px]">
                                                    {liveData.title}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 bg-white text-black font-black text-[10px] uppercase tracking-widest px-3.5 py-2.5 rounded-xl shadow-md group-hover:bg-neon-cyan group-hover:text-black transition-colors shrink-0">
                                            ACCÉDER AU LIVE
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 📱 SECTION: SOCIAL MEDIA FOLLOW & LIKE */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full space-y-3"
                >
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-neon-red" />
                            Réseaux Officiels • Suivre & Liker
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            Commue Dropsiders
                        </span>
                    </div>

                    {/* Instagram Card */}
                    <div className="bg-gradient-to-r from-[#12050b] to-[#0c0816] border border-pink-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg hover:border-pink-500/40 transition-all">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 p-0.5 shrink-0 shadow-md">
                                <div className="w-full h-full bg-[#050505] rounded-[10px] flex items-center justify-center">
                                    <Instagram className="w-5 h-5 text-pink-500" />
                                </div>
                            </div>
                            <div className="truncate">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                    Instagram <span className="text-[9px] text-gray-400 font-normal">@dropsiders.eu</span>
                                </h4>
                                <p className="text-[10px] text-gray-400 truncate">Actus, vidéos & backstage exclusifs</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => toggleLike('instagram')}
                                className={`p-2.5 rounded-xl border transition-all flex items-center gap-1 text-[10px] font-bold ${
                                    socialLikes.instagram 
                                        ? 'bg-pink-600/20 border-pink-500/50 text-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.3)]' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                }`}
                                title="Liker la page Instagram"
                            >
                                <Heart className={`w-4 h-4 ${socialLikes.instagram ? 'fill-pink-500 text-pink-500' : ''}`} />
                                <span className="hidden sm:inline">{likeCounts.instagram.toLocaleString()}</span>
                            </button>
                            <a
                                href="https://instagram.com/dropsiders.eu"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                                SUIVRE
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* TikTok Card */}
                    <div className="bg-gradient-to-r from-[#031014] to-[#0a0512] border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg hover:border-cyan-500/40 transition-all">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 to-pink-500 p-0.5 shrink-0 shadow-md">
                                <div className="w-full h-full bg-[#050505] rounded-[10px] flex items-center justify-center">
                                    <TiktokIcon className="w-5 h-5 text-cyan-400" />
                                </div>
                            </div>
                            <div className="truncate">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                    TikTok <span className="text-[9px] text-gray-400 font-normal">@dropsiders.eu</span>
                                </h4>
                                <p className="text-[10px] text-gray-400 truncate">Clips, mèmes, festival recaps</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => toggleLike('tiktok')}
                                className={`p-2.5 rounded-xl border transition-all flex items-center gap-1 text-[10px] font-bold ${
                                    socialLikes.tiktok 
                                        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                }`}
                                title="Liker la page TikTok"
                            >
                                <Heart className={`w-4 h-4 ${socialLikes.tiktok ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                                <span className="hidden sm:inline">{likeCounts.tiktok.toLocaleString()}</span>
                            </button>
                            <a
                                href="https://tiktok.com/@dropsiders.eu"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black rounded-xl text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                                SUIVRE
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>

                    {/* Facebook Card */}
                    <div className="bg-gradient-to-r from-[#050b18] to-[#070b14] border border-blue-600/20 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg hover:border-blue-600/40 transition-all">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-blue-600 p-0.5 shrink-0 shadow-md flex items-center justify-center">
                                <Facebook className="w-5 h-5 text-white" />
                            </div>
                            <div className="truncate">
                                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                    Facebook <span className="text-[9px] text-gray-400 font-normal">@dropsidersfr</span>
                                </h4>
                                <p className="text-[10px] text-gray-400 truncate">Communauté, évènements & actus</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => toggleLike('facebook')}
                                className={`p-2.5 rounded-xl border transition-all flex items-center gap-1 text-[10px] font-bold ${
                                    socialLikes.facebook 
                                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                }`}
                                title="Liker la page Facebook"
                            >
                                <Heart className={`w-4 h-4 ${socialLikes.facebook ? 'fill-blue-500 text-blue-500' : ''}`} />
                                <span className="hidden sm:inline">{likeCounts.facebook.toLocaleString()}</span>
                            </button>
                            <a
                                href="https://facebook.com/dropsidersfr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                                SUIVRE
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* 🔗 SECTION: MAIN PORTAL LINKS */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full space-y-3 pt-2"
                >
                    <div className="px-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-1.5">
                            <Globe className="w-3 h-3 text-neon-cyan" />
                            Accès Directs Web & Shop
                        </span>
                    </div>

                    {/* Site Link */}
                    <Link to="/?full=1" onClick={() => sessionStorage.setItem('dropsiders_full_site', 'true')} className="block group">
                        <div className="bg-[#0a0a0a] hover:bg-white/10 border border-white/10 hover:border-neon-red/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-xl group-hover:scale-[1.01]">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center text-neon-red group-hover:bg-neon-red group-hover:text-white transition-colors">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-neon-red transition-colors">
                                        Site Officiel DROPSIDERS
                                    </h3>
                                    <p className="text-[10px] text-gray-400">dropsiders.fr • Le Portail Electro N°1</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                                →
                            </div>
                        </div>
                    </Link>

                    {/* Shop Link */}
                    <Link to="/shop" className="block group">
                        <div className="bg-gradient-to-r from-[#0d0914] to-[#0a0a0a] hover:bg-white/10 border border-purple-500/20 hover:border-purple-500/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-xl group-hover:scale-[1.01]">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-purple-400 transition-colors flex items-center gap-2">
                                        Boutique Dropsiders
                                        <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full">SHOP</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400">Merch, vêtements, accessoires & goodies</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                                →
                            </div>
                        </div>
                    </Link>

                    {/* News Link */}
                    <Link to="/news" className="block group">
                        <div className="bg-[#0a0a0a] hover:bg-white/10 border border-white/10 hover:border-neon-cyan/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-xl group-hover:scale-[1.01]">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan group-hover:bg-neon-cyan group-hover:text-black transition-colors">
                                    <Newspaper className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-neon-cyan transition-colors">
                                        Dernières Actus & News
                                    </h3>
                                    <p className="text-[10px] text-gray-400">Nouveautés musique, releases & festivals</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                                →
                            </div>
                        </div>
                    </Link>

                    {/* Agenda Link */}
                    <Link to="/agenda" className="block group">
                        <div className="bg-[#0a0a0a] hover:bg-white/10 border border-white/10 hover:border-yellow-500/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-xl group-hover:scale-[1.01]">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-yellow-400 transition-colors">
                                        Agenda Festivals & Soirées
                                    </h3>
                                    <p className="text-[10px] text-gray-400">Calendrier des meilleurs événements electro</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                                →
                            </div>
                        </div>
                    </Link>

                    {/* Clips & Mixes */}
                    <Link to="/clips" className="block group">
                        <div className="bg-[#0a0a0a] hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-xl group-hover:scale-[1.01]">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-black transition-colors">
                                    <Music className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-green-400 transition-colors">
                                        Clips & Mixes Dropsiders
                                    </h3>
                                    <p className="text-[10px] text-gray-400">Écouter les derniers sets et podcasts</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                                →
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Spotify & YouTube Additional Buttons */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-full grid grid-cols-2 gap-3 pt-1"
                >
                    <a
                        href="https://open.spotify.com/user/dropsiders"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-[#0a0a0a] border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white transition-all shadow-lg group"
                    >
                        <SpotifyIcon className="w-4 h-4 fill-emerald-500 group-hover:scale-110 transition-transform" />
                        Spotify
                    </a>
                    <a
                        href="https://www.youtube.com/@dropsiders"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 bg-gradient-to-r from-red-950/40 to-[#0a0a0a] border border-red-500/20 hover:border-red-500/50 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-white transition-all shadow-lg group"
                    >
                        <Radio className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                        YouTube
                    </a>
                </motion.div>

            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-10 text-center space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                    © DROPSIDERS • BRANDING PORTAL
                </p>
                <div className="flex items-center justify-center gap-4 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                    <Link to="/" className="hover:text-neon-red transition-colors">Accueil</Link>
                    <span>•</span>
                    <Link to="/contact" className="hover:text-neon-red transition-colors">Contact</Link>
                </div>
            </footer>
        </div>
    );
}
