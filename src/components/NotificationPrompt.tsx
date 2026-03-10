import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Zap, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { subscribeUser, triggerTestNotification } from '../utils/push';

export function NotificationPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<'prompt' | 'loading' | 'success' | 'denied' | 'error'>('prompt');
    const [hasTested, setHasTested] = useState(false);

    useEffect(() => {
        // Ne pas montrer si déjà refusé ou déjà accepté cette session
        const hasPrompted = sessionStorage.getItem('notification_prompted');
        const isPermissionDenied = 'Notification' in window && Notification.permission === 'denied';
        const isPermissionGranted = 'Notification' in window && Notification.permission === 'granted';

        // Si déjà accordé, on n'affiche pas le prompt de base
        if (isPermissionGranted) return;

        if (!hasPrompted && !isPermissionDenied) {
            // Un peu de délai
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = async () => {
        setStatus('loading');
        try {
            await subscribeUser();
            setStatus('success');
            sessionStorage.setItem('notification_prompted', 'true');

            // On laisse 3s pour voir le succès puis on ferme
            setTimeout(() => setIsVisible(false), 3000);
        } catch (error: any) {
            console.error('Subscription error:', error);
            if (Notification.permission === 'denied') {
                setStatus('denied');
            } else {
                setStatus('error');
            }
        }
    };

    const handleTest = async () => {
        setHasTested(true);
        try {
            await triggerTestNotification();
        } catch (e) {
            console.error('Test failed', e);
        }
    };

    const handleDecline = () => {
        setIsVisible(false);
        sessionStorage.setItem('notification_prompted', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-6 left-6 z-[9999] max-w-[340px] w-full"
                >
                    <div className="bg-dark-bg/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_40px_80px_rgba(0,0,0,0.9)] overflow-hidden relative group">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/10 blur-[60px] rounded-full -mr-16 -mt-16 animate-pulse" />

                        <div className="flex gap-5">
                            <div className="shrink-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
                                        status === 'denied' ? 'bg-red-500/10 border-red-500 text-red-500' :
                                            status === 'error' ? 'bg-amber-500/10 border-amber-500 text-amber-500' :
                                                'bg-white/5 border-white/10 text-white'
                                    }`}>
                                    <motion.div
                                        animate={status === 'loading' ? { rotate: 360 } : { scale: [0.9, 1.1, 1] }}
                                        transition={status === 'loading' ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0.3 }}
                                    >
                                        {status === 'success' ? <ShieldCheck className="w-7 h-7" /> :
                                            status === 'denied' || status === 'error' ? <AlertCircle className="w-7 h-7" /> :
                                                <Bell className="w-7 h-7" />}
                                    </motion.div>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-display font-black text-white uppercase italic tracking-tighter">
                                        Active tes <span className="text-neon-red">Notifications</span>
                                    </h3>
                                    <button onClick={handleDecline} className="p-1 -mr-1 text-white/20 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mb-6">
                                    {status === 'denied' ?
                                        "Oups ! Tu as bloqué les notifications. Change ça dans tes réglages navigateur." :
                                        "Ne rate plus aucun lineup secret et les alertes festival en direct !"}
                                </p>

                                {status === 'prompt' && (
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleAccept}
                                            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-neon-red hover:text-white transition-all shadow-xl shadow-white/5 group/btn"
                                        >
                                            <Zap className="w-4 h-4 fill-current group-hover:animate-bounce" />
                                            AUTORISER LE LIVE
                                        </button>
                                        <button
                                            onClick={handleDecline}
                                            className="w-full py-4 bg-white/5 border border-white/10 text-white/40 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            Peut-être plus tard
                                        </button>
                                    </div>
                                )}

                                {status === 'loading' && (
                                    <div className="py-6 text-center">
                                        <div className="text-[8px] font-black uppercase tracking-[0.4em] animate-pulse text-neon-cyan">Connexion au serveur Push...</div>
                                    </div>
                                )}

                                {status === 'success' && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                            <Check className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[9px] font-black text-emerald-500 uppercase">C'est tout bon !</span>
                                        </div>
                                        {!hasTested && (
                                            <button
                                                onClick={handleTest}
                                                className="w-full py-3 bg-neon-cyan text-black rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-white transition-all"
                                            >
                                                Lancer un test
                                            </button>
                                        )}
                                    </div>
                                )}

                                {(status === 'denied' || status === 'error') && (
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
                                    >
                                        Compris
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bottom hint */}
                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3 opacity-30 group-hover:opacity-60 transition-opacity">
                            <Info className="w-3 h-3 text-white" />
                            <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">PWA Compatible. IOS : "Sur l'écran d'accueil"</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
