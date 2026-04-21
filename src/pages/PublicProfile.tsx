import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Trophy, Music, Calendar, Zap, Headphones, PlayCircle, Download, Camera, Info, ExternalLink, MessageSquare, Star } from 'lucide-react';
// Removed broken import: import { getEventColor } from '../utils/colors';

export function PublicProfile() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [publicEvents, setPublicEvents] = useState<any[]>([]);
    
    // Simulating API Fetch for the user profile public data
    useEffect(() => {
        setIsLoading(true);
        // Simulate a small delay for fetching from backend
        const timer = setTimeout(() => {
            // Mock data structure - now empty as requested
            const mockUser = {
                username: username,
                avatar: null,
                createdAt: new Date().toISOString(),
                scores: { drops: 0, xp: 0 },
                rank: "MEMBRE",
                isVerified: false,
                mixes: [],
                reviews: [],
                agendaFavorites: []
            };
            
            setPublicEvents([]);
            
            setProfile(mockUser);
            setIsLoading(false);
        }, 800);
        
        return () => clearTimeout(timer);
    }, [username]);

    const stats = [
        { label: 'DROPS', value: profile?.scores?.drops || 0, icon: <Zap className="w-5 h-5 text-neon-cyan" />, color: 'from-neon-cyan/20 to-transparent' },
        { label: 'RANG', value: profile?.rank || 'DROPSIDER', icon: <Shield className="w-5 h-5 text-neon-red" />, color: 'from-neon-red/20 to-transparent' },
        { label: 'XP', value: profile?.scores?.xp || 0, icon: <Trophy className="w-5 h-5 text-amber-500" />, color: 'from-amber-500/20 to-transparent' }
    ];

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
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-6 relative overflow-hidden">
            {/* Background Ambient Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-neon-cyan/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-1/4 -left-20 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                
                {/* Profile Header */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden group mb-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                    
                    <div className="relative group/avatar shrink-0">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/10 p-1 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-dark-bg/80 rounded-full">
                                    <User className="w-20 h-20 text-gray-700" />
                                </div>
                            )}
                        </div>
                        {profile.isVerified && (
                           <div className="absolute bottom-2 right-2 w-10 h-10 bg-neon-cyan rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] border border-dark-bg">
                               <Shield className="w-5 h-5 text-dark-bg fill-current" />
                           </div>
                        )}
                    </div>
                    
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl md:text-6xl font-display font-black text-white italic uppercase tracking-tighter mb-2 break-all drop-shadow-lg">
                            {profile.username}
                        </h1>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-6 inline-block bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                            Rejoint en {(new Date(profile.createdAt)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </p>
                        
                        {/* Stats Row */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className={`px-5 py-3 bg-white/5 border border-white/10 rounded-2xl bg-gradient-to-br ${stat.color} backdrop-blur-md flex items-center gap-3`}>
                                    <div>{stat.icon}</div>
                                    <div className="text-left">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">{stat.label}</p>
                                        <p className="text-xl font-display font-black text-white italic leading-none mt-1">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Mixes & Music */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Mix Studio Public View */}
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 relative overflow-hidden backdrop-blur-sm">
                            <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-neon-purple/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(191,0,255,0.2)]">
                                        <Headphones className="w-6 h-6 text-neon-purple" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-display font-black text-white uppercase tracking-widest italic leading-none">Studio</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tracks, Edits & Mixes</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-black text-white">{profile.mixes?.length || 0}</span>
                            </div>

                            {profile.mixes && profile.mixes.length > 0 ? (
                                <div className="space-y-3 relative z-10">
                                    {profile.mixes.map((mix: any) => (
                                        <div key={mix.id} className="group p-4 bg-white/5 border border-white/5 hover:border-neon-purple/30 rounded-2xl flex items-center justify-between transition-all hover:bg-neon-purple/5">
                                            <div className="flex items-center gap-4">
                                                <button className="w-12 h-12 bg-neon-purple rounded-xl flex items-center justify-center shadow-lg shadow-neon-purple/20 hover:scale-105 transition-transform shrink-0 relative overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:translate-y-full hover:before:translate-y-0 before:transition-transform">
                                                    <PlayCircle className="w-6 h-6 text-white relative z-10" />
                                                </button>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-neon-purple uppercase tracking-[0.2em]">{mix.type}</span>
                                                    <h4 className="text-sm md:text-base font-bold text-white uppercase italic tracking-tighter truncate max-w-[200px] md:max-w-md">{mix.title}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{mix.duration}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-500" />
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{mix.uploadDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="w-10 h-10 border border-white/10 bg-black/40 hover:bg-neon-cyan/20 hover:border-neon-cyan/30 rounded-xl flex items-center justify-center text-gray-400 hover:text-neon-cyan transition-all hidden md:flex shrink-0">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 relative z-10">
                                    <Headphones className="w-12 h-12 mx-auto mb-4 text-gray-600 opacity-50" />
                                    <p className="text-[12px] text-gray-400 font-black uppercase tracking-[0.2em]">Ce Dropsider n'a aucun mix public.</p>
                                </div>
                            )}
                        </div>

                        {/* Public Photo Gallery Section placeholder */}
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-sm">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Galerie</h3>
                                </div>
                            </div>
                            <div className="text-center py-10">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Aucune photo partagée publiquement</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Info & Agenda */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Featured Events */}
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                                <div className="w-10 h-10 bg-neon-red/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,18,65,0.2)]">
                                    <Calendar className="w-5 h-5 text-neon-red" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Agenda</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">En favoris</p>
                                </div>
                            </div>

                            {publicEvents.length > 0 ? (
                                <div className="space-y-4">
                                    {publicEvents.map((evt) => {
                                        // A stub for getEventColor logic if it was imported, fallback to basic neon-red
                                        const colClass = "neon-red"; 
                                        return (
                                            <div key={evt.id} className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 cursor-pointer h-24" onClick={() => navigate(`/agenda?event=${evt.id}`)}>
                                                <img src={evt.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                                    <span className="text-[8px] font-black uppercase text-neon-cyan mb-1">{evt.type}</span>
                                                    <h4 className="text-xs font-black text-white uppercase tracking-tighter truncate">{evt.title}</h4>
                                                    <p className="text-[8px] font-bold text-gray-300 uppercase">{new Date(evt.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Agenda privé ou vide</p>
                                </div>
                            )}
                        </div>
                        {/* User Reviews */}
                        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-sm">
                            <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-6">
                                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                    <MessageSquare className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Ses Avis</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Festivals</p>
                                </div>
                            </div>

                            {profile.reviews && profile.reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {profile.reviews.map((review: any) => (
                                        <div key={review.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-black text-white uppercase tracking-tighter">{review.festival}</h4>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic border-l-2 border-yellow-500/30 pl-3">
                                                "{review.text}"
                                            </p>
                                            <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-2">{review.date}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Aucun avis publié</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default PublicProfile;
