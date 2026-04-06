import { useState } from 'react';
import { SocialSuite } from '../components/SocialSuite';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Instagram, Zap, Smartphone, Image as ImageIcon } from 'lucide-react';
import { getAuthHeaders, isSuperAdmin } from '../utils/auth';

export function SocialStudioPage() {
    const navigate = useNavigate();
    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const adminUser = localStorage.getItem('admin_user');
    const isAuthorized = storedPermissions.includes('all') || 
                         storedPermissions.includes('social') || 
                         storedPermissions.includes('social_studio') ||
                         isSuperAdmin(adminUser);

    const [isAuthenticated, setIsAuthenticated] = useState(isAuthorized);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Fallback pour accès via code direct
        const storedPass = localStorage.getItem('admin_password') || '';
        if (password !== '' && password === storedPass) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_auth', 'true');
        } else {
            setError('Code incorrect ou accès non autorisé');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-2xl"
                >
                    <div className="flex justify-center mb-8">
                        <div className="p-5 bg-neon-pink/10 rounded-3xl border border-neon-pink/20">
                            <Instagram className="w-10 h-10 text-neon-pink" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white text-center mb-2 uppercase italic tracking-tighter">Social Studio</h1>
                    <p className="text-gray-500 text-center text-[10px] font-black uppercase tracking-[0.3em] mb-10">Accès Créateur Dropsiders</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
                            <p className="text-red-400 text-[10px] font-black text-center uppercase leading-relaxed">
                                Vous n'avez pas les permissions nécessaires ou votre session a expiré.
                            </p>
                        </div>
                        <input
                            type="password"
                            placeholder="CODE D'ACCÈS DE SECOURS"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-center font-black tracking-[0.5em] focus:outline-none focus:border-neon-pink transition-all"
                        />
                        {error && <p className="text-red-500 text-[10px] font-black text-center uppercase">{error}</p>}
                        <button className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-neon-pink hover:text-white transition-all shadow-xl">
                            Entrer dans le studio
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="w-full text-gray-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Retour au tableau de bord
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="flex fixed top-4 left-4 lg:top-8 lg:left-8 z-[210] items-center gap-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 lg:p-4 bg-black/60 lg:bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/20 lg:border-white/10 backdrop-blur-3xl lg:backdrop-blur-md transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest group shadow-[0_0_20px_rgba(0,0,0,0.5)] lg:shadow-none"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden sm:inline">RETOUR AU SITE</span>
                    <span className="sm:hidden">RETOUR</span>
                </button>
                <div className="hidden lg:flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                    <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse shadow-[0_0_10px_#ff00ff]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">STUDIO MODE : ON</span>
                </div>
            </div>


            <SocialSuite
                title="NEWS DROPSIDERS"
                imageUrl=""
                onClose={() => {
                    window.close();
                    navigate('/admin');
                }}
            />

            {/* Landing UI if SocialSuite is closed or as a background */}
            <div className="h-screen flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-8 opacity-20">
                    <h2 className="text-[10vw] font-black text-white italic leading-none tracking-tighter">STUDIO</h2>
                    <div className="flex justify-center gap-12">
                        <div className="flex flex-col items-center gap-4">
                            <Smartphone className="w-12 h-12 text-white" />
                            <span className="text-xs font-black uppercase tracking-widest">REELS</span>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <ImageIcon className="w-12 h-12 text-white" />
                            <span className="text-xs font-black uppercase tracking-widest">POSTS</span>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <Zap className="w-12 h-12 text-white" />
                            <span className="text-xs font-black uppercase tracking-widest">QUICK</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
