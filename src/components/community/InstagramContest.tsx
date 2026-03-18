import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, CheckCircle2, Info, Sparkles, Gamepad2, Trophy } from 'lucide-react';
import { UserAuthModal } from '../auth/UserAuthModal';

export function InstagramContest({ onPlayClick }: { onPlayClick?: () => void }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [festivalHandle, setFestivalHandle] = useState('@tomorrowland');

    React.useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.contest_festival_handle) {
                    setFestivalHandle(data.contest_festival_handle);
                }
            })
            .catch(() => {});
    }, []);

    const handleShare = () => {
        window.open('https://www.instagram.com/dropsiders.fr/', '_blank');
    };

    if (status === 'success') {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-[4rem] p-12 text-center backdrop-blur-3xl"
            >
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/40">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-4">
                    PARTICIPATION <span className="text-green-500">VALIDÉE</span>
                </h2>
                <p className="text-white/40 font-black uppercase tracking-widest text-xs leading-loose">
                    Merci pour votre partage ! Notre équipe vérifiera votre story. Bonne chance pour le tirage au sort !
                </p>
                <button 
                    onClick={() => setStatus('idle')}
                    className="mt-10 px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all"
                >
                    RETOUR AU CONCOURS
                </button>
            </motion.div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 px-4">
            <UserAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            
            {/* Header Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group overflow-hidden bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-[4rem] p-12 md:p-20 text-white shadow-2xl"
            >
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Instagram className="w-64 h-64 -mr-20 -mt-20 rotate-12" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">ÉVÉNEMENT SPÉCIAL</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-black uppercase italic tracking-tighter leading-[0.9]">
                        Gagnez vos <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">PASS FESTIVAL</span> via Instagram
                    </h1>

                    <p className="text-sm md:text-lg font-medium opacity-80 max-w-2xl leading-relaxed">
                        Partagez votre score du Quiz en story, taguez <span className="font-black">@dropsiders.fr</span> ainsi que <span className="font-black text-white">{festivalHandle}</span> pour valider votre participation.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                            onClick={handleShare}
                            className="bg-white text-black px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all shadow-xl"
                        >
                            <Instagram className="w-5 h-5" />
                            VOIR LE POST À PARTAGER
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Steps & Form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Steps */}
                <div className="md:col-span-5 space-y-4">
                    {[
                        { num: '01', title: 'ABONNEZ-VOUS', desc: 'Suivez @dropsiders.fr sur Instagram.' },
                        { num: '02', title: 'PARTAGEZ', desc: 'Republiez le dernier post ou l\'affiche du festival en story.' },
                        { num: '03', title: 'TAGUEZ', desc: `Identifiez @dropsiders.fr et ${festivalHandle} sur votre story (votre compte doit être PUBLIC).` },
                        { num: '04', title: 'VALIDEZ', desc: 'Jouez au Quiz et validez votre score à la fin.' }
                    ].map((step, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-6 group hover:bg-white/10 transition-all"
                        >
                            <span className="text-2xl font-display font-black italic text-white/20 group-hover:text-neon-red transition-colors">{step.num}</span>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-white tracking-widest mb-1">{step.title}</h4>
                                <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Form */}
                <div className="md:col-span-7">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-16 backdrop-blur-3xl text-center space-y-10 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/10 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-neon-red/20 transition-colors" />
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-neon-red/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-neon-red/30 shadow-[0_0_30px_rgba(255,18,65,0.2)]">
                                <Trophy className="w-10 h-10 text-neon-red" />
                            </div>

                            <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter leading-tight">
                                Prêt à tenter <br/>ta <span className="text-neon-red text-glow-red">chance ?</span>
                            </h3>

                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed max-w-sm mx-auto">
                                Joue au Blind Test maintenant, réalise ton meilleur score et partage-le en story pour valider ton inscription au tirage au sort.
                            </p>

                            <div className="pt-6">
                                <button 
                                    onClick={onPlayClick} 
                                    className="w-full py-8 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] hover:bg-neon-red hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4 group/btn"
                                >
                                    COMMENCER LE QUIZ
                                    <Gamepad2 className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                                </button>
                                
                                <p className="mt-6 text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                                    Un tirage au sort chaque semaine • Réservé aux membres
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Info Section */}
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                        <Info className="w-6 h-6 text-white/40" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-white tracking-widest"> Règlement du concours</h4>
                        <p className="text-[8px] font-bold text-white/20 uppercase max-w-md">Multipliez vos chances en partageant sur TikTok également ! Tirage au sort tous les dimanches à 20h.</p>
                    </div>
                </div>
                <button className="px-6 py-3 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">
                    VOIR LE RÈGLEMENT COMPLET
                </button>
            </div>
        </div>
    );
}
