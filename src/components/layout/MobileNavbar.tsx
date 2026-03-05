import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, Video, Calendar, X, Music, Users, ShoppingBag, Shield, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';
import settings from '../../data/settings.json';
import { useLanguage } from '../../context/LanguageContext';

export function MobileNavbar() {
    const location = useLocation();
    const { t } = useLanguage();
    const [takeoverEnabled, setTakeoverEnabled] = useState(settings.takeover?.enabled || false);
    const [takeoverStatus, setTakeoverStatus] = useState(settings.takeover?.status || 'off');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth');
        setIsAdmin(auth === 'true');

        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    setTakeoverEnabled(data.takeover?.enabled || false);
                    setTakeoverStatus(data.takeover?.status || 'off');
                }
            } catch (e) { }
        };
        fetchSettings();
        const interval = setInterval(fetchSettings, 30000);
        return () => clearInterval(interval);
    }, []);

    const mainItems = [
        { icon: Home, label: 'Accueil', path: '/' },
        { icon: Newspaper, label: 'Actu', path: '/news' },
        {
            icon: Users,
            label: 'Communaute',
            path: '/communaute',
            isCenter: true,
            color: 'neon-pink'
        },
        {
            icon: Video,
            label: 'LIVE',
            path: '/live',
            isLive: takeoverEnabled && takeoverStatus === 'live',
            color: 'neon-red'
        },
        { icon: Calendar, label: 'Agenda', path: '/agenda' }
    ];

    const menuItems = [
        { icon: Music, label: t('nav.music'), path: '/musique', color: 'text-neon-green' },
        { icon: Newspaper, label: t('nav.recaps'), path: '/recaps', color: 'text-neon-purple' },
        { icon: Info, label: t('nav.interviews'), path: '/interviews', color: 'text-neon-blue' },
        { icon: Users, label: t('nav.team'), path: '/team', color: 'text-neon-yellow' },
        { icon: ShoppingBag, label: t('nav.shop'), path: '/shop', color: 'text-neon-red' },
        ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: '/admin', color: 'text-white' }] : [])
    ];

    return (
        <>
            {/* Bottom Bar */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[92%] max-w-[400px]">
                <motion.div
                    initial={{ y: 100, x: "-50%", opacity: 0 }}
                    animate={{ y: 0, x: "-50%", opacity: 1 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-2xl border border-white/10 h-16 rounded-[2rem] flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto w-[92%] max-w-[400px]"
                >
                    {mainItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        if (item.isCenter) {
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className="relative flex items-center justify-center -mt-10"
                                >
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center relative transition-all bg-neon-pink shadow-[0_0_30px_rgba(255,105,180,0.6)] animate-pulse">
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`flex flex-col items-center justify-center transition-all relative py-1 min-w-[50px] ${isActive ? 'text-white' : 'text-gray-500'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="global-tab-indicator"
                                        className="absolute -top-[17px] w-8 h-[2px] bg-neon-red shadow-[0_0_10px_rgba(255,18,65,0.8)]"
                                    />
                                )}
                                <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110 text-neon-red' : 'scale-95 group-active:scale-75'}`} />
                            </Link>
                        );
                    })}
                </motion.div>
            </div>

            {/* Expanded Menu Modal */}
            <AnimatePresence>
                {isMenuOpen && (
                    <div className="fixed inset-0 z-[120] lg:hidden">

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/10 rounded-t-[2.5rem] p-8 pb-12 shadow-2xl"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-display font-black text-white uppercase italic">Menu</h2>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl active:bg-white/10 transition-all"
                                    >
                                        <div className={twMerge("p-2 rounded-xl bg-black/20", item.color)}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-white">{item.label}</span>
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-6">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">DROPSIDERS V2.0</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
