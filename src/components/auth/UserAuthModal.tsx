import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Trophy, Music, LogOut, ChevronRight, Heart, Camera, Upload, Loader2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

interface UserAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserAuthModal({ isOpen, onClose }: UserAuthModalProps) {
    const { user, isLoggedIn, logout, loginSocial } = useUser();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isSocialLoading, setIsSocialLoading] = useState(false);
    const [discordLoading, setDiscordLoading] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsSocialLoading(true);
            try {
                const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                
                const googleUser = res.data;
                loginSocial({
                    username: googleUser.name,
                    email: googleUser.email,
                    avatar: googleUser.picture,
                    id: googleUser.sub,
                    provider: 'google'
                });
                onClose();
            } catch (error) {
                console.error('Google login failed', error);
            } finally {
                setIsSocialLoading(false);
            }
        },
        onError: () => console.error('Google login error'),
    });

    const handleDiscordLogin = () => {
        setDiscordLoading(true);
        const popup = window.open(
            '/auth/discord',
            'discord-oauth',
            'width=500,height=700,scrollbars=yes,resizable=yes,status=yes'
        );

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'DISCORD_AUTH_SUCCESS' && event.data.user) {
                const discordUser = event.data.user;
                loginSocial({
                    username: discordUser.username,
                    email: discordUser.email,
                    avatar: discordUser.avatar,
                    id: discordUser.id,
                    provider: 'discord'
                });
                window.removeEventListener('message', handleMessage);
                setDiscordLoading(false);
                onClose();
            }
        };

        window.addEventListener('message', handleMessage);

        // Cleanup if popup is closed manually
        const checkInterval = setInterval(() => {
            if (popup?.closed) {
                clearInterval(checkInterval);
                window.removeEventListener('message', handleMessage);
                setDiscordLoading(false);
            }
        }, 500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !email) return;

        setIsAuthLoading(true);
        let finalAvatar = avatar;

        try {
            // If there's a new local avatar, upload it to R2 in 'membre' folder
            if (avatar && avatar.startsWith('data:image')) {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: `avatar_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`,
                        content: avatar,
                        type: 'image/jpeg',
                        path: 'membre'
                    })
                });

                const data = await response.json();
                if (data.success && data.url) {
                    finalAvatar = data.url;
                }
            }

            loginSocial({
                username,
                email,
                avatar: finalAvatar || undefined,
                provider: 'email'
            });
            onClose();
        } catch (error) {
            console.error('Auth/Upload failed', error);
        } finally {
            setIsAuthLoading(false);
        }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.9, y: 20 }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
                        />
    
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative w-full max-w-lg bg-dark-bg border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl text-left my-8"
                        >
                        {/* Header Gradient */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-red" />

                        <div className="p-8 md:p-12">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                        {isLoggedIn 
                                            ? <><span className="text-neon-red">Mon</span> Compte</>
                                            : <><span className="text-neon-red">Espace</span> Membre</>
                                        }
                                    </h2>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                                        {isLoggedIn ? 'Vos statistiques & sauvegardes' : 'Connectez-vous pour sauvegarder vos scores'}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {isLoggedIn ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <div className="w-16 h-16 bg-neon-red/10 border-2 border-neon-red/30 rounded-2xl overflow-hidden flex items-center justify-center">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-neon-red" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white uppercase italic">{user?.username}</h3>
                                            <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl group hover:border-neon-purple/50 transition-all">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-neon-purple/20 rounded-xl">
                                                    <Trophy className="w-4 h-4 text-neon-purple" />
                                                </div>
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Expérience Lab</span>
                                            </div>
                                            <div className="text-2xl font-black text-white italic">
                                                {user?.scores.festival_producer || 0} <span className="text-[10px] text-gray-400 not-italic">XP</span>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-white/5 border border-white/10 rounded-3xl group hover:border-neon-cyan/50 transition-all">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-neon-cyan/20 rounded-xl">
                                                    <Music className="w-4 h-4 text-neon-cyan" />
                                                </div>
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Quiz Score</span>
                                            </div>
                                            <div className="text-2xl font-black text-white italic">
                                                {user?.scores.quiz || 0} <span className="text-[10px] text-gray-400 not-italic">PTS</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity / Tracklist */}
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <Heart className="w-3 h-3 text-neon-red" /> Favoris Récents
                                        </h4>
                                        <div className="space-y-2">
                                            {user?.trackIds.length === 0 ? (
                                                <p className="text-xs text-gray-500 italic py-2">Aucun ID sauvegardé pour l'instant...</p>
                                            ) : (
                                                user?.trackIds.slice(0, 3).map((id, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl">
                                                        <span className="text-xs font-bold text-white uppercase tracking-tight truncate max-w-[200px]">{id}</span>
                                                        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            logout();
                                            onClose();
                                        }}
                                        className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
                                    >
                                        <LogOut className="w-4 h-4" /> Se déconnecter
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Social Login Buttons */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => googleLogin()}
                                            disabled={isSocialLoading}
                                            className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.17-4.53z" />
                                            </svg>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Google</span>
                                        </button>
                                        <button
                                            onClick={handleDiscordLogin}
                                            disabled={discordLoading}
                                            className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#5865F2] hover:border-[#5865F2] transition-all group disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
                                            </svg>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-white transition-colors">Discord</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-white/10" />
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">OU</span>
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>

                                    <form onSubmit={handleAuth} className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Avatar Upload */}
                                        <div className="flex flex-col items-center gap-4 mb-2">
                                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                                                <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-neon-red/50">
                                                    {avatar ? (
                                                        <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Camera className="w-8 h-8 text-gray-600 group-hover:text-neon-red transition-all" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-neon-red p-2 rounded-full shadow-lg">
                                                    <Upload className="w-3 h-3 text-white" />
                                                </div>
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">Photo de Profil (Optionnel)</p>
                                        </div>

                                        <div className="group">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block ml-1 italic">Pseudo <span className="text-neon-red">*</span></label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-neon-red/50 transition-all placeholder:text-gray-700"
                                                    placeholder="Ton Pseudo Dropsiders"
                                                />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block ml-1">Adresse Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-red transition-colors" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:outline-none focus:border-neon-red/50 transition-all"
                                                    placeholder="alex@dropsiders.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isAuthLoading}
                                            className="w-full py-5 bg-white text-black rounded-2xl font-display font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neon-red hover:text-white transition-all shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3"
                                        >
                                            {isAuthLoading ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Création...</>
                                            ) : 'Créer mon compte'}
                                        </button>
                                        <p className="text-center text-[9px] text-gray-600 font-black uppercase tracking-widest mt-6">
                                            En créant un compte, vous acceptez nos <span className="text-gray-400 hover:text-white cursor-pointer transition-colors underline">CGU</span>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}
                        </div>
                    </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
