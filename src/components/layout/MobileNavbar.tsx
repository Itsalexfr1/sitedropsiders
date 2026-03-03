import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, Video, Calendar, MoreHorizontal, X, Music, Users, ShoppingBag, Shield, Info } from 'lucide-react';
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
        { icon: Home, label: 'Home', path: '/' },
        { icon: Newspaper, label: 'News', path: '/news' },
        {
            icon: Video,
            label: 'LIVE',
            path: '/live',
            isLive: takeoverEnabled && takeoverStatus === 'live',
            color: 'neon-red'
        },
        { icon: Calendar, label: 'Agenda', path: '/agenda' },
        { icon: MoreHorizontal, label: 'Plus', path: '#menu', onClick: () => setIsMenuOpen(true) }
    ];

    const menuItems = [
        { icon: Music, label: t('nav.music'), path: '/musique', color: 'text-neon-green' },
        { icon: Newspaper, label: t('nav.recaps'), path: '/recaps', color: 'text-neon-purple' },
        { icon: Users, label: t('nav.communaute'), path: '/communaute', color: 'text-neon-pink' },
        { icon: Info, label: t('nav.interviews'), path: '/interviews', color: 'text-neon-blue' },
        { icon: Users, label: t('nav.team'), path: '/team', color: 'text-neon-yellow' },
        { icon: ShoppingBag, label: t('nav.shop'), path: '/shop', color: 'text-neon-red' },
        ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: '/admin', color: 'text-white' }] : [])
    ];

    return (
        <>
            {/* Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[110] pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="bg-black/95 backdrop-blur-3xl border-t border-white/10 h-16 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pointer-events-auto relative overflow-hidden"
                >
                    {/* Active Indicator Glow */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-neon-red/50 to-transparent opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-neon-red/[0.03] to-transparent pointer-events-none" />

                    {mainItems.map((item) => {
                        const isActive = location.pathname === item.path && item.path !== '#menu';
                        const Icon = item.icon;

                        const content = (
                            <div className="relative flex flex-col items-center justify-center w-12 h-12 group">
                                <div className={twMerge(
                                    "relative p-2.5 rounded-2xl transition-all duration-300",
                                    isActive ? "bg-neon-red/20 text-neon-red scale-110 shadow-[0_0_20px_rgba(255,0,51,0.2)]" : (item.label === 'Plus' && isMenuOpen ? "text-neon-red" : "text-gray-400")
                                )}>
                                    <Icon className={twMerge(
                                        "w-5 h-5",
                                        item.isLive ? "text-neon-red animate-pulse drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]" : ""
                                    )} />
                                    {item.isLive && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_rgba(255,0,0,0.8)]" />
                                    )}
                                </div>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-active"
                                        className="absolute -bottom-1 w-1.5 h-1.5 bg-neon-red rounded-full shadow-[0_0_10px_#ff0033]"
                                    />
                                )}
                                <span className={twMerge(
                                    "text-[8px] font-black uppercase tracking-[0.1em] mt-1 transition-colors",
                                    isActive ? "text-neon-red" : "text-gray-500"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                        );

                        if (item.path === '#menu') {
                            return (
                                <button key={item.label} onClick={item.onClick} className="pointer-events-auto outline-none">
                                    {content}
                                </button>
                            );
                        }

                        return (
                            <Link key={item.label} to={item.path} className="pointer-events-auto outline-none">
                                {content}
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
