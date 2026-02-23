import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [region, setRegion] = useState<'EU' | 'US' | 'OTHER'>('EU');
    const { t } = useLanguage();

    useEffect(() => {
        const consent = localStorage.getItem('dropsiders-cookie-consent');
        if (consent) return;

        // Detect location
        fetch('/api/geo')
            .then(res => res.json())
            .then(data => {
                const country = data.country;
                const isEU = ['FR', 'BE', 'CH', 'DE', 'ES', 'IT', 'LU', 'NL', 'GB', 'IE', 'AT', 'DK', 'FI', 'GR', 'PT', 'SE', 'NO', 'IS', 'LI'].includes(country);
                const isUS = country === 'US';

                if (isEU || isUS) {
                    setRegion(isUS ? 'US' : 'EU');
                    setTimeout(() => setIsVisible(true), 1500);
                }
            })
            .catch(() => {
                // Fallback to showing it just in case
                setTimeout(() => setIsVisible(true), 2000);
            });
    }, []);

    const handleConsent = (level: 'all' | 'none') => {
        localStorage.setItem('dropsiders-cookie-consent', level);
        setIsVisible(false);

        // Notify AdSense or GTM if needed
        if (level === 'all') {
            (window as any).gtag?.('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[450px] z-[100]"
                >
                    <div className="bg-dark-bg/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/10 blur-[60px] rounded-full group-hover:bg-neon-red/20 transition-colors" />

                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-neon-red/10 rounded-2xl border border-neon-red/20 shrink-0">
                                    <Cookie className="w-8 h-8 text-neon-red" />
                                </div>
                                <div className="space-y-2 pr-4">
                                    <h3 className="text-lg font-display font-black text-white uppercase italic tracking-wider">
                                        {t('cookies.title')}
                                    </h3>
                                    <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                        {t('cookies.desc')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleConsent('all')}
                                        className="flex-2 px-8 py-4 bg-neon-red text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-neon-red/80 transition-all shadow-[0_0_30px_rgba(255,0,51,0.2)] active:scale-95"
                                    >
                                        {t('cookies.accept')}
                                    </button>
                                    <button
                                        onClick={() => handleConsent('none')}
                                        className="flex-1 px-4 py-4 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        {t('cookies.refuse')}
                                    </button>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <Link
                                        to="/cookies"
                                        className="text-[10px] text-gray-500 hover:text-neon-red font-bold uppercase tracking-widest transition-colors"
                                    >
                                        {t('cookies.manage')}
                                    </Link>
                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                        {region === 'US' ? 'CCPA / US COMPLIANCE' : 'RGPD / EEE / UK'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
