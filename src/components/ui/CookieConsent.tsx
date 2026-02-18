import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
// import { useLanguage } from '../../context/LanguageContext';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    // const { t } = useLanguage();

    useEffect(() => {
        const consent = localStorage.getItem('dropsiders-cookie-consent');
        if (!consent) {
            // Show after a small delay
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('dropsiders-cookie-consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-50"
                >
                    <div className="bg-dark-bg/90 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-neon-red/10 blur-[50px] rounded-full group-hover:bg-neon-red/20 transition-colors" />

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                                    <Cookie className="w-6 h-6 text-neon-red" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">
                                        Cookies & Confidentialité
                                    </h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Nous utilisons des cookies pour améliorer votre expérience sur Dropsiders. En continuant, vous acceptez notre politique de confidentialité.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 py-2.5 bg-neon-red text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-neon-red/80 transition-colors shadow-lg shadow-neon-red/20"
                                >
                                    Accepter !
                                </button>
                                <Link
                                    to="/cookies"
                                    className="px-4 py-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Infos
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
