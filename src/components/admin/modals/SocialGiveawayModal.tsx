import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Instagram, Facebook, RefreshCcw, CheckCircle2, User, Heart, Trophy, Gift, AlertCircle, ExternalLink, Smartphone, Image as ImageIcon, Download } from 'lucide-react';
import { TakeoverContext } from '../../../context/TakeoverContext';
import { useContext } from 'react';

interface SocialGiveawayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SocialGiveawayModal({ isOpen, onClose }: SocialGiveawayModalProps) {
    const takeover = useContext(TakeoverContext);
    const showNotification = takeover?.showNotification || ((msg: string) => alert(msg));
    const [postUrl, setPostUrl] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [step, setStep] = useState<'input' | 'extracting' | 'results'>('input');
    const [simulatedCount, setSimulatedCount] = useState(0);
    const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);

    const [winner, setWinner] = useState<{ username: string; profilePic: string; comment: string; liked: boolean; follows: boolean } | null>(null);

    const handleExtract = () => {
        if (!postUrl.includes('instagram.com') && !postUrl.includes('facebook.com')) {
            showNotification("Veuillez entrer une URL valide d'Instagram ou Facebook.", 'error');
            return;
        }

        setStep('extracting');
        setIsExtracting(true);
        setSimulatedCount(0);

        // Animation de simulation d'extraction de commentaires
        const interval = setInterval(() => {
            setSimulatedCount(prev => prev + Math.floor(Math.random() * 15) + 5);
        }, 300);

        setTimeout(() => {
            clearInterval(interval);
            setIsExtracting(false);
            
            // Simuler la sélection d'un gagnant !
            const fakeWinners = [
                { username: 'techno_lover99', profilePic: 'https://ui-avatars.com/api/?name=Techno+Lover&background=0D8ABC&color=fff', comment: 'Lourddd je veux y aller !! 🔥', liked: true, follows: true },
                { username: 'marie_djne', profilePic: 'https://ui-avatars.com/api/?name=Marie+DJ&background=10B981&color=fff', comment: 'Incroyable setup 🖤', liked: true, follows: true },
                { username: 'alex_music', profilePic: 'https://ui-avatars.com/api/?name=Alex+M&background=F59E0B&color=fff', comment: 'Présent !', liked: true, follows: true },
                { username: 'dropsider_fan', profilePic: 'https://ui-avatars.com/api/?name=Dropsider+Fan&background=8B5CF6&color=fff', comment: 'J\'en rêve depuis des mois 😍', liked: true, follows: true }
            ];
            
            setWinner(fakeWinners[Math.floor(Math.random() * fakeWinners.length)]);
            setStep('results');
        }, 4000);
    };

    const reset = () => {
        setStep('input');
        setPostUrl('');
        setWinner(null);
        setSimulatedCount(0);
        setIsGeneratingVisual(false);
    };

    const generateVisual = async (type: 'post' | 'story') => {
        if (!winner) return;
        setIsGeneratingVisual(true);

        const width = 1080;
        const height = type === 'post' ? 1350 : 1920;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // 1. Background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a0b12');
        grad.addColorStop(0.5, '#1a0a0f');
        grad.addColorStop(1, '#0a0b12');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Load Logo
        const logo = new Image();
        logo.src = '/Logo.png';
        await new Promise((resolve) => { logo.onload = resolve; logo.onerror = resolve; });

        if (logo.complete) {
            const logoW = 350;
            const logoH = (logo.height / logo.width) * logoW;
            ctx.drawImage(logo, width/2 - logoW/2, type === 'post' ? 120 : 250, logoW, logoH);
        }

        // 3. Text Elements
        ctx.textAlign = 'center';
        
        ctx.font = '900 italic 40px "Montserrat", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('FÉLICITATIONS', width/2, (type === 'post' ? 450 : 700));

        ctx.font = '900 italic 120px "Orbitron", sans-serif';
        ctx.fillStyle = '#ff1241';
        ctx.fillText('GAGNANT', width/2, (type === 'post' ? 580 : 850));

        ctx.font = '900 80px "Montserrat", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`@${winner.username.toUpperCase()}`, width/2, (type === 'post' ? 780 : 1100));

        // 4. Footer
        ctx.font = '900 20px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('DROPSIDERS.EU', width/2, height - (type === 'post' ? 60 : 100));

        // Export
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `dropsiders-winner-${type}-${winner.username}.png`;
        link.click();
        
        setIsGeneratingVisual(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose} 
                    className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Gift className="w-32 h-32 text-neon-cyan" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-neon-cyan rounded-2xl flex items-center justify-center p-0.5">
                                <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                                    <Gift className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">Tirage au Sort <span className="text-neon-cyan">Social</span></h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sélectionnez un gagnant parmi vos commentaires</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all relative z-10">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center min-h-[400px] relative">
                        {step === 'input' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-lg space-y-6">
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-500">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase leading-relaxed">
                                        Les API Meta (Facebook/Instagram) sont très strictes. Cet outil utilise un module d'extraction simulé. 
                                        En production réelle, pour vérifier le follow, il est nécessaire d'utiliser la Graph API avancée ou un service tiers.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-widest uppercase text-gray-400 ml-2">Lien de la publication Instagram ou Facebook</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center gap-2">
                                            {postUrl.includes('facebook') ? <Facebook className="w-5 h-5 text-blue-500" /> : <Instagram className="w-5 h-5 text-pink-500" />}
                                        </div>
                                        <input
                                            type="text"
                                            value={postUrl}
                                            onChange={(e) => setPostUrl(e.target.value)}
                                            placeholder="https://www.instagram.com/p/..."
                                            className="w-full pl-12 pr-4 py-4 bg-black/60 border border-white/10 rounded-2xl text-white font-medium focus:border-neon-cyan focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleExtract}
                                    disabled={!postUrl}
                                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-neon-cyan transition-all disabled:opacity-50 disabled:hover:bg-white"
                                >
                                    Lancer le tirage
                                </button>
                            </motion.div>
                        )}

                        {step === 'extracting' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm text-center">
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-pulse" />
                                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-neon-cyan border-r-pink-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Search className="w-10 h-10 text-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Extraction en cours...</h3>
                                    <div className="bg-black/40 border border-white/10 rounded-xl px-6 py-4 flex items-center justify-between gap-8">
                                        <div className="text-left space-y-1">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Commentaires scannés</p>
                                            <p className="text-2xl font-black text-white font-display tabular-nums">{simulatedCount}</p>
                                        </div>
                                        <div className="h-10 w-px bg-white/10" />
                                        <div className="text-left space-y-1">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Statut</p>
                                            <p className="text-xs font-black text-neon-cyan uppercase">Vérification likes & follows</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'results' && winner && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md flex flex-col items-center text-center space-y-8">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan to-pink-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                                    <div className="w-32 h-32 rounded-full border-4 border-white p-1 relative z-10 bg-black">
                                        <img src={winner.profilePic} alt={winner.username} className="w-full h-full rounded-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest z-20 flex items-center gap-2 shadow-xl whitespace-nowrap">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        GAGNANT !
                                    </div>
                                </div>

                                <div className="space-y-4 w-full pt-4">
                                    <h3 className="text-3xl font-display font-black text-white italic tracking-tighter">@{winner.username}</h3>
                                    
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-cyan" />
                                        <p className="text-sm text-gray-300 italic">"{winner.comment}"</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${winner.liked ? 'bg-pink-500/10 border-pink-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                            <Heart className={`w-6 h-6 ${winner.liked ? 'text-pink-500 fill-pink-500' : 'text-red-500'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">A aimé le post</span>
                                            {winner.liked ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                                        </div>
                                        <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${winner.follows ? 'bg-neon-cyan/10 border-neon-cyan/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                            <User className={`w-6 h-6 flex-shrink-0 ${winner.follows ? 'text-neon-cyan' : 'text-red-500'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Suit la page</span>
                                            {winner.follows ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-red-500" />}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full">
                                    <button 
                                        onClick={reset}
                                        className="flex-1 py-4 bg-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <RefreshCcw className="w-4 h-4" />
                                        Nouveau Tirage
                                    </button>
                                    <a 
                                        href={`https://instagram.com/${winner.username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-4 bg-neon-cyan text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Contacter
                                    </a>
                                </div>

                                {/* Visual Generator */}
                                <div className="w-full pt-4 border-t border-white/5 space-y-4">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">Générer Visuel Victoire</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => generateVisual('post')}
                                            disabled={isGeneratingVisual}
                                            className="group flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 hover:border-neon-cyan/30 rounded-2xl transition-all"
                                        >
                                            <div className="p-3 bg-neon-cyan/20 text-neon-cyan rounded-xl group-hover:scale-110 transition-transform">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] font-black text-white uppercase italic">Format Post</div>
                                                <div className="text-[8px] text-gray-500 font-bold uppercase mt-1">1080x1350px</div>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => generateVisual('story')}
                                            disabled={isGeneratingVisual}
                                            className="group flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 hover:border-pink-500/30 rounded-2xl transition-all"
                                        >
                                            <div className="p-3 bg-pink-500/20 text-pink-500 rounded-xl group-hover:scale-110 transition-transform">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] font-black text-white uppercase italic">Format Story</div>
                                                <div className="text-[8px] text-gray-500 font-bold uppercase mt-1">1080x1920px</div>
                                            </div>
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] italic">L'image sera téléchargée automatiquement</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
