import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Shield, Trophy, Music, Calendar, Settings, LogOut, Check, X, Bell, Zap, Edit2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { ImageUploadModal } from '../components/ImageUploadModal';
const showNotification = (msg: string, type: 'success' | 'error' | 'info') => console.log(`[${type.toUpperCase()}] ${msg}`);

export function Profile() {
    const { user, updateUser, logout, isLoggedIn } = useUser();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState(user?.username || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [activeTab, setActiveTab ] = useState<'overview' | 'settings' | 'favorites'>('overview');

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [isLoggedIn, navigate]);

    if (!user) return null;

    const handleUpdateName = () => {
        if (username.trim() && username !== user.username) {
            updateUser({ username: username.trim() });
            showNotification('Pseudo mis à jour !', 'success');
        }
        setIsEditingName(false);
    };

    const handleAvatarSuccess = (url: string | string[]) => {
        const avatarUrl = Array.isArray(url) ? url[0] : url;
        updateUser({ avatar: avatarUrl });
        showNotification('Avatar mis à jour !', 'success');
        setIsAvatarModalOpen(false);
    };

    const stats = [
        { label: 'DROPS', value: user.scores?.drops || 0, icon: <Zap className="w-5 h-5 text-neon-cyan" />, color: 'from-neon-cyan/20 to-transparent' },
        { label: 'RANG', value: 'MEMBRE', icon: <Shield className="w-5 h-5 text-neon-purple" />, color: 'from-neon-purple/20 to-transparent' },
        { label: 'XP', value: user.scores?.xp || 0, icon: <Trophy className="w-5 h-5 text-amber-500" />, color: 'from-amber-500/20 to-transparent' },
        { label: 'TITRES', value: user.trackIds?.length || 0, icon: <Music className="w-5 h-5 text-neon-pink" />, color: 'from-neon-pink/20 to-transparent' }
    ];

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-6 relative overflow-hidden">
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
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan" />
                            
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="relative group/avatar">
                                    <div className="w-40 h-40 rounded-[40px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-1 relative overflow-hidden shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105">
                                        {user.avatar ? (
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
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={username} 
                                                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                                                className="w-full bg-black/40 border-2 border-neon-red rounded-2xl px-4 py-3 text-white font-display font-black uppercase italic outline-none"
                                                autoFocus
                                            />
                                            <button onClick={handleUpdateName} className="p-3 bg-neon-green/20 text-neon-green rounded-xl hover:bg-neon-green/40 transition-all"><Check className="w-5 h-5" /></button>
                                            <button onClick={() => setIsEditingName(false)} className="p-3 bg-white/5 text-gray-500 rounded-xl hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3">
                                            <h1 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">{user.username}</h1>
                                            <button onClick={() => setIsEditingName(true)} className="p-2 text-gray-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Membre depuis {(new Date(user.createdAt)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                                </div>

                                <div className="pt-6 w-full border-t border-white/5 flex flex-col gap-3">
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
                                                <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-neon-purple" />
                                                </div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Mes Événements</h3>
                                            </div>
                                            <div className="text-center py-10">
                                                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Aucun événement enregistré</p>
                                                <button onClick={() => navigate('/agenda')} className="mt-4 px-6 py-3 border border-neon-purple/30 rounded-xl text-neon-purple text-[10px] font-black uppercase tracking-widest hover:bg-neon-purple/10 transition-all">Consulter l'agenda</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'favorites' && (
                                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 text-center">
                                        <div className="w-20 h-20 bg-neon-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Music className="w-10 h-10 text-neon-pink" />
                                        </div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter mb-4">Ta Playlist Dropsiders</h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest max-w-sm mx-auto mb-8">Retrouve ici tous les titres que tu as likés pendant les Takeovers et lives.</p>
                                        <button onClick={() => navigate('/live')} className="px-10 py-4 bg-neon-pink text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-neon-pink/20 hover:scale-105 transition-all">Rejoindre le Live</button>
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
        </div>
    );
}

export default Profile;
