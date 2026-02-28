import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Zap, Mail } from 'lucide-react';
import { subscribeUser } from '../utils/push';

export function NotificationPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<'prompt' | 'loading' | 'success' | 'denied'>('prompt');

    const [wantNewsletter, setWantNewsletter] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        // Ne pas montrer si déjà refusé ou déjà accepté récement
        const hasPrompted = localStorage.getItem('notification_prompted');
        const isPermissionDenied = Notification.permission === 'denied';
        const isPermissionGranted = Notification.permission === 'granted';

        if (!hasPrompted && !isPermissionDenied && !isPermissionGranted) {
            // Attendre un peu avant d'afficher (3 secondes) pour ne pas agresser l'utilisateur
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = async () => {
        if (wantNewsletter && !email) {
            alert('Veuillez entrer votre email pour la newsletter');
            return;
        }

        setStatus('loading');

        if (wantNewsletter && email) {
            try {
                await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
            } catch (err: any) {
                console.error('Newsletter subscription error:', err);
            }
        }

        // 2. Inscription Push
        try {
            const subscription = await subscribeUser();
            if (subscription) {
                setStatus('success');
                localStorage.setItem('notification_prompted', 'true');
                // Fermer après un court délai
                setTimeout(() => setIsVisible(false), 2000);
            } else {
                // Permission refusée par le navigateur ou erreur
                if (Notification.permission === 'denied') {
                    setStatus('denied');
                } else {
                    setStatus('prompt');
                }
            }
        } catch (error: any) {
            setStatus('prompt');
        }
    };

    const handleDecline = () => {
        setIsVisible(false);
        // On s'en souvient pour ne plus l'embêter (pendant 7 jours par ex)
        localStorage.setItem('notification_prompted', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9 }}
                    className="fixed bottom-6 left-6 z-[9999] max-w-[300px] w-full"
                >
                    <div className="bg-dark-bg/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden relative group">
                        {/* Gradient de fond subtil */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-blue" />

                        <div className="flex gap-4">
                            <div className="shrink-0 w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <motion.div
                                    animate={status === 'loading' ? { rotate: 360 } : {}}
                                    transition={status === 'loading' ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                                >
                                    {status === 'success' ? (
                                        <Check className="w-6 h-6 text-neon-green" />
                                    ) : (
                                        <Bell className="w-6 h-6 text-neon-red" />
                                    )}
                                </motion.div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="text-base font-display font-black text-white uppercase italic tracking-tight leading-none">
                                        Stay <span className="text-neon-red">Alert</span>
                                    </h3>
                                    <button
                                        onClick={handleDecline}
                                        className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-4">
                                    Soyez alerté en direct des dernières <span className="text-white">Infos</span> et exclusivités Dropsiders. 🚀
                                </p>

                                {/* Options de consentement */}
                                <div className="space-y-3 mb-5">
                                    <button
                                        onClick={() => setWantNewsletter(!wantNewsletter)}
                                        className="flex items-center justify-between w-full p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all group/optin"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg transition-colors ${wantNewsletter ? 'bg-neon-purple/20 text-neon-purple' : 'bg-white/5 text-gray-500'}`}>
                                                <Mail className="w-3 h-3" />
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${wantNewsletter ? 'text-white' : 'text-gray-500'}`}>Newsletter</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${wantNewsletter ? 'bg-neon-purple' : 'bg-gray-800'}`}>
                                            <motion.div
                                                animate={{ x: wantNewsletter ? 16 : 0 }}
                                                className="w-3 h-3 rounded-full bg-white shadow-sm"
                                            />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {wantNewsletter && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="votre@email.com"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold text-white placeholder:text-gray-600 outline-none focus:border-neon-purple/50 transition-colors"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAccept}
                                        disabled={status === 'loading' || (wantNewsletter && !email)}
                                        className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${status === 'success'
                                            ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                                            : 'bg-white text-black hover:bg-neon-red hover:text-white shadow-lg shadow-white/5'
                                            }`}
                                    >
                                        {status === 'loading' ? 'Connexion...' : status === 'success' ? 'Activé !' : (
                                            <>
                                                <Zap className="w-3 h-3 group-hover/btn:animate-pulse" />
                                                Activer
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleDecline}
                                        className="py-3 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
