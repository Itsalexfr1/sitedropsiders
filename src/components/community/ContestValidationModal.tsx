import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Send, CheckCircle2, AlertCircle, Sparkles, X, ExternalLink, Trophy } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { UserAuthModal } from '../auth/UserAuthModal';

interface ContestValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    score: number;
    total: number;
    pseudo: string;
}

export function ContestValidationModal({ isOpen, onClose, score, total, pseudo }: ContestValidationModalProps) {
    const { isLoggedIn, user } = useUser();
    const [handle, setHandle] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [hasConsented, setHasConsented] = useState(false);
    const [festivalHandle, setFestivalHandle] = useState('@tomorrowland'); // Default placeholder

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.contest_festival_handle) {
                    setFestivalHandle(data.contest_festival_handle);
                }
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            setIsAuthModalOpen(true);
            return;
        }

        if (!handle.trim()) {
            setErrorMessage('Veuillez entrer votre pseudo Instagram');
            setStatus('error');
            return;
        }

        if (!handle.startsWith('@')) {
             setErrorMessage('Le pseudo doit commencer par @');
             setStatus('error');
             return;
        }

        if (!hasConsented) {
            setErrorMessage('Veuillez accepter les conditions');
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            const response = await fetch('/api/instagram-contest/participate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    handle: handle.trim(),
                    userId: user?.id,
                    email: user?.email,
                    username: user?.username || pseudo,
                    score: score,
                    total: total,
                    type: 'QUIZ_SCORE_SHARE'
                })
            });

            const data = await response.json();
            if (response.ok) {
                setStatus('success');
            } else {
                setErrorMessage(data.error || 'Une erreur est survenue');
                setStatus('error');
            }
        } catch (error) {
            setErrorMessage('Erreur de connexion');
            setStatus('error');
        }
    };

    const handleShareClick = () => {
        // En théorie on pourrait ouvrir Instagram, mais l'utilisateur doit faire sa story lui même
        window.open('https://instagram.com', '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <UserAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
                    >
                        {status === 'success' ? (
                            <div className="p-12 text-center space-y-8">
                                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/40">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-display font-black text-white italic uppercase mb-4">Participation <span className="text-green-500">Enregistrée !</span></h2>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] leading-loose">
                                        Ton score de {score}/{total} a été lié à ton compte Instagram {handle}.<br/>
                                        L'équipe Dropsiders va vérifier ta story dans les prochaines 24h.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-12 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neon-red hover:text-white transition-all"
                                >
                                    Fermer
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045]" />
                                
                                <div className="p-8 md:p-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-neon-red/10 rounded-2xl border border-neon-red/20">
                                                <Instagram className="w-8 h-8 text-neon-red" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                                                    Valider ma <span className="text-neon-red">Participation</span>
                                                </h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Étape finale du concours</p>
                                            </div>
                                        </div>
                                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-500 hover:text-white transition-all">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Score Banner */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-neon-red/20 flex items-center justify-center">
                                                    <Trophy className="w-6 h-6 text-neon-red" />
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Ton Score</span>
                                                    <span className="text-2xl font-display font-black text-white italic">{score} / {total}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[8px] font-black text-neon-cyan uppercase tracking-widest mb-1">Status</span>
                                                <span className="px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan rounded-full text-[9px] font-black uppercase">Prêt à valider</span>
                                            </div>
                                        </div>

                                        {/* Instructions */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                                Comment valider ?
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                                                    <span className="text-neon-red font-black italic text-lg opacity-50">01.</span>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed">
                                                        Prends une capture d'écran de ton score ou partage une affiche du festival.
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-neon-red/10 border border-neon-red/20 rounded-2xl space-y-2">
                                                    <span className="text-neon-red font-black italic text-lg">02.</span>
                                                    <p className="text-[9px] font-black text-white uppercase leading-relaxed">
                                                        Publie en Story Instagram en identifiant <span className="text-neon-red">@dropsiders.fr</span> et <span className="text-neon-cyan">{festivalHandle}</span> (Compte <b>Public</b> requis).
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-gray-500 ml-4 tracking-widest">Ton Pseudo Instagram (@...)</label>
                                                <div className="relative">
                                                     <Instagram className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                                                     <input 
                                                        type="text"
                                                        value={handle}
                                                        onChange={(e) => setHandle(e.target.value)}
                                                        placeholder="@TON_PSEUDO"
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-6 pl-14 pr-6 text-xl font-black italic uppercase focus:border-neon-red outline-none transition-all placeholder:text-white/10 text-white"
                                                     />
                                                </div>
                                            </div>

                                            <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <input 
                                                    type="checkbox" 
                                                    id="check-consent"
                                                    checked={hasConsented}
                                                    onChange={e => setHasConsented(e.target.checked)}
                                                    className="w-4 h-4 mt-1 accent-neon-red"
                                                />
                                                <label htmlFor="check-consent" className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed cursor-pointer">
                                                    Je confirme avoir partagé mon score en identifiant les deux comptes. Mon compte est <b>PUBLIC</b> et ma story restera visible 24h.
                                                </label>
                                            </div>

                                            {status === 'error' && (
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase flex items-center gap-3">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {errorMessage}
                                                </div>
                                            )}

                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={handleShareClick}
                                                    className="px-6 py-6 bg-white/5 border border-white/10 rounded-3xl text-white hover:bg-white/10 transition-all flex items-center justify-center group"
                                                >
                                                    <ExternalLink className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={status === 'loading'}
                                                    className="flex-1 py-6 bg-neon-red text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-neon-red/20 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4"
                                                >
                                                    {status === 'loading' ? (
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            Valider ma participation
                                                            <Send className="w-5 h-5" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
