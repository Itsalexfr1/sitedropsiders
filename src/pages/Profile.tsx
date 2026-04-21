import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Shield, Trophy, Music, Calendar, Settings, LogOut, Check, X, Bell, Zap, Edit2, PlayCircle, UploadCloud, Headphones, Download, Share2, MessageSquare, Star, Send, Instagram } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { MixUploadModal } from '../components/profile/MixUploadModal';
import wikiFestivals from '../data/wiki_festivals.json';
import { UserAuthModal } from '../components/auth/UserAuthModal';
const showNotification = (msg: string, type: 'success' | 'error' | 'info') => console.log(`[${type.toUpperCase()}] ${msg}`);

export function Profile() {
    const { user, updateUser, logout, isLoggedIn } = useUser();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState(user?.username || '');
    const [instagram, setInstagram] = useState(user?.instagram || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [activeTab, setActiveTab ] = useState<'overview' | 'mixes' | 'reviews' | 'settings' | 'favorites'>('overview');
    const [uploadType, setUploadType] = useState<'Track' | 'Remix' | 'Edit' | 'Mix'>('Mix');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [selectedFestival, setSelectedFestival] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [customFestivalImage, setCustomFestivalImage] = useState<File | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [userMixes, setUserMixes] = useState<any[]>([]);

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

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // No early return, we handle UI status below

    const handleUpdateName = () => {
        const updates: any = {};
        if (username.trim() && username !== user?.username) updates.username = username.trim();
        if (instagram.trim() !== (user?.instagram || '')) updates.instagram = instagram.trim();
        
        if (Object.keys(updates).length > 0) {
            updateUser(updates);
            showNotification('Profil mis à jour !', 'success');
        }
        setIsEditingName(false);
    };

    const handleDeleteMix = async (id: string) => {
        const mixToDelete = userMixes.find(m => m.id === id);
        if (!mixToDelete) return;

        if (window.confirm("Es-tu sûr de vouloir supprimer ce contenu du Studio Dropsiders et du Cloud ? Cette action est irréversible.")) {
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
            alert("Lien du profil copié !");
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

    const getEventColor = (genre: string, type: string) => {
        const g = (genre || '').toLowerCase().trim();
        const t = (type || '').toLowerCase().trim();
        if (g.includes('musique') || g.includes('music')) return 'neon-green';
        if (t === 'festival' || g.includes('techno') || g.includes('hybride') || g.includes('hardcore')) return 'neon-red';
        if (g.includes('house') || g.includes('tech house')) return 'neon-blue';
        if (g.includes('melodic') || t === 'jeux concours') return 'neon-yellow';
        if (g.includes('big room') || g.includes('drum') || g.includes('hardtechno')) return 'neon-purple';
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
                <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-neon-red/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
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
                        <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md w-fit">
                            {[
                                { id: 'overview', label: 'Vue d\'ensemble', icon: <User className="w-4 h-4" /> },
                                { id: 'mixes', label: 'Mix Studio', icon: <Headphones className="w-4 h-4" /> },
                                { id: 'reviews', label: 'Avis & Notes', icon: <MessageSquare className="w-4 h-4" /> },
                                { id: 'favorites', label: 'Favoris', icon: <Music className="w-4 h-4" /> },
                                { id: 'settings', label: 'Sécurité', icon: <Settings className="w-4 h-4" /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
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

                                {activeTab === 'mixes' && (
                                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                            <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                                                <Headphones className="w-5 h-5 text-neon-purple" />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Mix Studio</h3>
                                        </div>
                                        
                                        <div className="flex gap-2 justify-center mb-6">
                                            {['Track', 'Remix', 'Edit', 'Mix'].map(type => (
                                                <button 
                                                    key={type}
                                                    onClick={() => setUploadType(type as any)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === type ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(191,0,255,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white border border-white/10'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="p-8 border-2 border-dashed border-neon-purple/30 bg-neon-purple/5 rounded-[32px] text-center hover:bg-neon-purple/10 hover:border-neon-purple/50 transition-all cursor-pointer group flex flex-col items-center gap-4 relative overflow-hidden">
                                            <input 
                                                type="file" 
                                                accept="audio/mpeg" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > 150 * 1024 * 1024) {
                                                            alert("Le fichier est trop volumineux. La limite est de 150 Mo.");
                                                            return;
                                                        }
                                                        setSelectedAudioFile(file);
                                                        setIsUploadModalOpen(true);
                                                    }
                                                }}
                                            />
                                            <UploadCloud className="w-12 h-12 text-neon-purple/50 group-hover:text-neon-purple transition-colors group-hover:-translate-y-1 transform duration-300" />
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-widest mb-1 group-hover:text-neon-purple transition-colors">Uploader un nouveau {uploadType}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase italic">Format MP3 uniquement - Max 150 Mo</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Mes Mixes Publics</h4>
                                            
                                            {userMixes.length > 0 ? (
                                                <div className="space-y-3">
                                                    {userMixes.map((mix) => (
                                                        <div key={mix.id} className="group p-4 bg-white/5 border border-white/5 hover:border-neon-purple/30 rounded-2xl flex items-center justify-between transition-all hover:bg-neon-purple/5">
                                                            <div className="flex items-center gap-4">
                                                                <button className="w-10 h-10 bg-neon-purple/20 text-neon-purple rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <PlayCircle className="w-5 h-5 shadow-[0_0_10px_rgba(191,0,255,0.5)]" />
                                                                </button>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest">{mix.type}</p>
                                                                    <h5 className="text-xs font-bold text-white uppercase italic">{mix.title}</h5>
                                                                    <p className="text-[8px] text-gray-500 font-bold uppercase">{mix.genre ? `${mix.genre} · ` : ''}{mix.duration}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => handleDeleteMix(mix.id)}
                                                                    className="w-10 h-10 border border-red-500/10 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/30 rounded-xl flex items-center justify-center text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                                    title="Supprimer définitivement"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                                <div className="text-[8px] text-gray-600 font-bold uppercase hidden sm:block">{mix.uploadDate}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 opacity-50 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                                                    <Headphones className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em]">Aucun mix mis en ligne pour le moment.</p>
                                                </div>
                                            )}
                                        </div>
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
                                                        alert("Merci de remplir tous les champs !");
                                                        return;
                                                    }
                                                    if (!wikiFestivals.some(f => f.name.toLowerCase() === selectedFestival.toLowerCase())) {
                                                        if (!customFestivalImage) {
                                                            alert("Ce festival n'est pas répertorié. Vous devez ajouter une photo du festival pour l'envoyer !");
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
                                                            alert("Avis envoyé avec succès ! Il apparaîtra sur la page Communauté.");
                                                            setReviewRating(0);
                                                            setReviewText('');
                                                            setSelectedFestival('');
                                                        } else {
                                                            alert("Erreur lors de la soumission de l'avis.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Erreur réseau.");
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
                                            <p className="text-xs text-gray-600 font-medium italic">La suppression de votre profil est irréversible et effacera tous vos scores et favoris.</p>
                                            <button className="px-8 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Réinitialiser mon profil</button>
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
            </div>

            {!isLoggedIn && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="max-w-md w-full bg-[#050510]/80 border-2 border-white/10 rounded-[3rem] p-10 md:p-14 text-center space-y-10 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
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
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full py-4 bg-transparent text-white/40 hover:text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] transition-all"
                                >
                                    Retour à l'accueil
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <UserAuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />
        </>
    );
}

export default Profile;
