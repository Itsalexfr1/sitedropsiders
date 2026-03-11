import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Zap, ShieldCheck, AlertCircle, BellOff, Settings2, Info } from 'lucide-react';
import { subscribeUser, unsubscribeUser, triggerTestNotification } from '../utils/push';

interface NotificationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
    const [status, setStatus] = useState<'prompt' | 'loading' | 'success' | 'denied' | 'error'>('prompt');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [settings, setSettings] = useState({
        live: true,
        news: true,
        agenda: true,
        drops: true
    });

    useEffect(() => {
        if (isOpen) {
            checkStatus();
            const savedSettings = localStorage.getItem('notification_preferences');
            if (savedSettings) {
                try {
                    setSettings(JSON.parse(savedSettings));
                } catch (e) {
                    console.error('Failed to parse settings');
                }
            }
        }
    }, [isOpen]);

    const checkStatus = () => {
        const isGranted = 'Notification' in window && Notification.permission === 'granted';
        const isDenied = 'Notification' in window && Notification.permission === 'denied';
        
        setIsSubscribed(isGranted);
        if (isDenied) setStatus('denied');
        else if (isGranted) setStatus('success');
        else setStatus('prompt');
    };

    const handleToggleAll = async () => {
        if (isSubscribed) {
            try {
                await unsubscribeUser();
                setIsSubscribed(false);
                setStatus('prompt');
            } catch (e) {
                console.error('Unsubscribe error', e);
            }
        } else {
            setStatus('loading');
            try {
                await subscribeUser();
                setIsSubscribed(true);
                setStatus('success');
            } catch (error: any) {
                console.error('Subscription error:', error);
                if (Notification.permission === 'denied') {
                    setStatus('denied');
                } else {
                    setStatus('error');
                }
            }
        }
    };

    const toggleSetting = (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        localStorage.setItem('notification_preferences', JSON.stringify(newSettings));
    };

    const handleTest = async () => {
        try {
            await triggerTestNotification();
        } catch (e) {
            console.error('Test failed', e);
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl text-left my-8"
                        >
                        <div className="p-8 md:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-neon-red/10 rounded-2xl border border-neon-red/20 outline-none">
                                        <Bell className="w-6 h-6 text-neon-red" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                                            Réglages <span className="text-neon-red">Notifications</span>
                                        </h2>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Gère tes alertes Dropsiders</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Global Switch */}
                                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isSubscribed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                            {isSubscribed ? <ShieldCheck className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-white uppercase tracking-widest">
                                                {isSubscribed ? 'Notifications Activées' : 'Notifications Désactivées'}
                                            </div>
                                            <div className="text-[10px] text-gray-600 font-bold uppercase mt-1">Autorise les alertes push sur ton navigateur</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleToggleAll}
                                        disabled={status === 'loading'}
                                        className={`relative w-14 h-7 rounded-full transition-colors flex items-center px-1 ${isSubscribed ? 'bg-neon-red shadow-[0_0_15px_rgba(255,0,51,0.4)]' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: isSubscribed ? 28 : 0 }}
                                            className="w-5 h-5 bg-white rounded-full shadow-lg"
                                        />
                                    </button>
                                </div>

                                {isSubscribed && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {[
                                                { id: 'live', label: 'Live & Takeover', icon: Zap },
                                                { id: 'news', label: 'Actualités & News', icon: Settings2 },
                                                { id: 'agenda', label: 'Prochains Festivals', icon: Check },
                                                { id: 'drops', label: 'Drops & Boutique', icon: Info },
                                            ].map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => toggleSetting(item.id as any)}
                                                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${settings[item.id as keyof typeof settings] ? 'bg-white/[0.05] border-white/20 text-white' : 'bg-black/40 border-white/5 text-gray-600 opacity-50'}`}
                                                >
                                                    <item.icon className={`w-4 h-4 ${settings[item.id as keyof typeof settings] ? 'text-neon-red' : ''}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={handleTest}
                                            className="w-full py-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-neon-cyan hover:text-black transition-all"
                                        >
                                            Envoyer une notification de test
                                        </button>
                                    </motion.div>
                                )}

                                {status === 'denied' && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                            Les notifications sont bloquées par ton navigateur. Change les permissions dans tes réglages.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-30">
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">PWA Compatible</span>
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Dropsiders V2.0</span>
                            </div>
                        </div>
                    </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
