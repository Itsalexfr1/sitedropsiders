import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Sun, Moon, Filter, Shield } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useHoverSound } from '../../hooks/useHoverSound';
import newsData from '../../data/news.json';
import recapsData from '../../data/recaps.json';
import agendaData from '../../data/agenda.json';
import { useLanguage } from '../../context/LanguageContext';
import { getArticleLink, getRecapLink, getAgendaLink, getGalleryLink } from '../../utils/slugify';
import { FlagIcon } from '../ui/FlagIcon';
import settings from '../../data/settings.json';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const playHoverSound = useHoverSound();
    const { language, setLanguage, t } = useLanguage();
    const [shopEnabled, setShopEnabled] = useState(settings.shop_enabled);
    const [shopPasswordProtected, setShopPasswordProtected] = useState((settings as any).shop_password_protected || false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const auth = localStorage.getItem('admin_auth');
            setIsAdmin(auth === 'true');
        };

        checkAuth();
        // Check periodically or on focus
        window.addEventListener('focus', checkAuth);

        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    setShopEnabled(data.shop_enabled);
                    setShopPasswordProtected(data.shop_password_protected || false);
                }
            } catch (e) {
                // Keep default
            }
        };
        fetchSettings();
    }, []);

    const navItems = [
        { name: t('nav.news'), path: '/news' },
        { name: t('nav.recaps'), path: '/recaps' },
        { name: t('nav.agenda'), path: '/agenda' },
        { name: t('nav.galerie'), path: '/galerie' },
        { name: t('nav.interviews'), path: '/interviews' },
        { name: t('nav.team'), path: '/team' },
        { name: t('nav.contact'), path: '/contact' },
        ...(shopEnabled && !shopPasswordProtected ? [{ name: t('nav.shop'), path: '/shop' }] : []),
        ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
    ];

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        // Toggle dark mode class on document
        document.documentElement.classList.toggle('light-mode');
    };


    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        let query = searchQuery.toLowerCase();
        if (query === 'multistyle') query = 'multi-';

        const filteredNews = (newsData as any[])
            .map(item => ({ ...item, searchType: item.category.toLowerCase() }))
            .filter((item: any) =>
                item.title?.toLowerCase().includes(query) ||
                item.summary?.toLowerCase().includes(query)
            );

        const filteredRecaps = (recapsData as any[])
            .map(item => ({ ...item, searchType: 'recap', category: 'Recaps' }))
            .filter((item: any) =>
                item.title?.toLowerCase().includes(query) ||
                item.festival?.toLowerCase().includes(query)
            );

        const filteredAgenda = (agendaData as any[])
            .map(item => ({ ...item, searchType: 'agenda', category: 'Agenda' }))
            .filter((item: any) =>
                item.title?.toLowerCase().includes(query) ||
                item.location?.toLowerCase().includes(query) ||
                item.genre?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.type?.toLowerCase().includes(query)
            );

        const combined = [
            ...filteredAgenda.slice(0, 4),
            ...filteredNews.slice(0, 4),
            ...filteredRecaps.slice(0, 4)
        ];

        return combined.slice(0, 10);
    }, [searchQuery]);

    const handleSearchResultClick = (item: any) => {
        let path = '';
        const searchType = (item.searchType || item.category || '').toLowerCase();

        if (searchType.includes('news') || searchType.includes('interview') || searchType.includes('musique') || searchType.includes('music')) {
            path = getArticleLink(item);
        }
        else if (searchType === 'recap') path = getRecapLink(item);
        else if (searchType === 'agenda') path = getAgendaLink(item);
        else if (searchType === 'galerie') path = getGalleryLink(item);

        if (path) {
            navigate(path);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-dark-bg/80 backdrop-blur-xl border-b border-white/10">
            <div className="w-full px-4 md:px-12 xl:px-16 2xl:px-24">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Desktop Social Icons - Left Side Stacked */}
                        <div className="hidden lg:flex flex-col items-center gap-1.5 border-r border-white/10 pr-4 mr-1">
                            <a href="https://instagram.com/dropsiders.eu" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-all hover:scale-110">
                                <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="w-3 h-3 brightness-0 invert" />
                            </a>
                            <a href="https://tiktok.com/@dropsiders.eu" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-all hover:scale-110">
                                <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-3 h-3 brightness-0 invert" />
                            </a>
                            <a href="https://www.facebook.com/dropsidersfr" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-all hover:scale-110">
                                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" className="w-3 h-3 brightness-0 invert" />
                            </a>
                        </div>

                        {/* Logo */}
                        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center group py-2">
                            <img
                                src="/Logo.png"
                                alt="DROPSIDERS"
                                className="logo-img h-10 md:h-14 w-auto max-w-[150px] md:max-w-none object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={playHoverSound}
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-2 text-gray-400 hover:text-neon-red transition-colors rounded-lg hover:bg-white/5"
                        >
                            <Search className="w-5 h-5" />
                        </motion.button>

                        {/* Theme Toggle Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={playHoverSound}
                            onClick={toggleTheme}
                            className="p-2 text-gray-400 hover:text-neon-red transition-colors rounded-lg hover:bg-white/5"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </motion.button>

                        <div className="flex gap-1 bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-full pointer-events-auto">
                            <button
                                onClick={() => setLanguage('fr')}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'fr' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FlagIcon location="France" className="w-3.5 h-2.5" />
                                <span className="hidden sm:block">FR</span>
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black transition-all ${language === 'en' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FlagIcon location="USA" className="w-3.5 h-2.5" />
                                <span className="hidden sm:block">EN</span>
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                onMouseEnter={playHoverSound}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <>
                            {/* Backdrop to ensure results are visible and "take lead" */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSearchOpen(false)}
                                className="fixed inset-0 bg-dark-bg/60 backdrop-blur-sm z-[80]"
                            />

                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="relative z-[90] pb-4"
                            >
                                <div className="relative max-w-2xl mx-auto">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={t('common.search')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-dark-bg/90 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-neon-red shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                if (searchQuery) setSearchQuery('');
                                                else setIsSearchOpen(false);
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Search by Style Suggestions */}
                                    {!searchQuery && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6"
                                        >
                                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                                                <Filter className="w-3 h-3" />
                                                {t('nav.explore_styles')}
                                            </p>
                                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                                                {[
                                                    { name: 'Techno', color: 'text-neon-red border-neon-red/20 hover:bg-neon-red/10' },
                                                    { name: 'House', color: 'text-neon-pink border-neon-pink/20 hover:bg-neon-pink/10' },
                                                    { name: 'Tech House', color: 'text-neon-green border-neon-green/20 hover:bg-neon-green/10' },
                                                    { name: 'Progressive', color: 'text-neon-cyan border-neon-cyan/20 hover:bg-neon-cyan/10' },
                                                    { name: 'Trance', color: 'text-neon-blue border-neon-blue/20 hover:bg-neon-blue/10' },
                                                    { name: 'Big Room', color: 'text-neon-purple border-neon-purple/20 hover:bg-neon-purple/10' },
                                                    { name: 'Hardmusic', color: 'text-neon-orange border-neon-orange/20 hover:bg-neon-orange/10' },
                                                    { name: 'Drum & Bass', color: 'text-neon-green border-neon-green/20 hover:bg-neon-green/10' },
                                                    { name: 'Multistyle', color: 'text-white border-white/20 hover:bg-white/10' }
                                                ].map(style => (
                                                    <button
                                                        key={style.name}
                                                        onClick={() => setSearchQuery(style.name)}
                                                        onMouseEnter={playHoverSound}
                                                        className={`px-1 py-2 bg-white/5 border rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all ${style.color} whitespace-nowrap overflow-hidden text-ellipsis`}
                                                        title={style.name}
                                                    >
                                                        {style.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Search Results Dropdown */}
                                    {searchQuery && searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-dark-bg/95 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-2xl z-[100] max-h-[60vh] overflow-y-auto custom-scrollbar"
                                        >
                                            {searchResults.map((item: any) => (
                                                <motion.button
                                                    key={item.id}
                                                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                    onClick={() => handleSearchResultClick(item)}
                                                    onMouseEnter={playHoverSound}
                                                    className="w-full text-left px-4 py-3 border-b border-white/5 last:border-0 transition-colors"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="relative w-16 h-16 flex-shrink-0 group">
                                                            <img
                                                                src={item.image}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                            <div className="absolute inset-0 bg-neon-red/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={twMerge(
                                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,0,0,0.3)]",
                                                                    item.searchType === 'agenda' ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30" :
                                                                        item.searchType === 'recap' ? "bg-neon-red/20 text-neon-red border border-neon-red/30" :
                                                                            item.isFocus ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30" :
                                                                                (item.category || '').toLowerCase() === 'musique' ? "bg-neon-green/20 text-neon-green border border-neon-green/30" :
                                                                                    "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                                                                )}>
                                                                    {item.isFocus ? t('article_detail.focus').toUpperCase() : item.category}
                                                                </span>
                                                                {item.genre && (
                                                                    <span className="text-[9px] font-bold text-gray-500 uppercase border border-white/10 px-1.5 py-0.5 rounded">
                                                                        {item.genre}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] text-gray-500 font-bold ml-auto">
                                                                    {item.date}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-neon-red transition-colors uppercase italic tracking-tight">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                                                {item.summary || item.description || item.location}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* No Results Message */}
                                    {searchQuery && searchResults.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-dark-bg/95 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center shadow-2xl z-[100]"
                                        >
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-6 h-6 text-gray-600" />
                                            </div>
                                            <p className="text-white font-bold mb-1">{t('common.no_results')}</p>
                                            <p className="text-gray-500 text-sm">"{searchQuery}"</p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-dark-bg/98 backdrop-blur-2xl border-b border-white/10 overflow-hidden shadow-2xl relative z-[100]"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-1">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <motion.div
                                        key={item.path}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onMouseEnter={playHoverSound}
                                    >
                                        <Link
                                            to={item.path}
                                            onClick={() => setIsOpen(false)}
                                            className={twMerge(
                                                "block px-3 py-4 text-base font-medium border-l-2 transition-colors",
                                                isActive
                                                    ? "border-neon-red text-neon-red bg-neon-red/5"
                                                    : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav >
    );
}

interface NavItemProps {
    item: { name: string; path: string; icon?: any };
    isActive: boolean;
}

function NavItem({ item, isActive }: NavItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const playHoverSound = useHoverSound();

    return (
        <motion.div
            onMouseEnter={() => {
                setIsHovered(true);
                playHoverSound();
            }}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
        >
            <Link
                to={item.path}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={twMerge(
                    "relative block px-4 py-2 text-sm font-bold tracking-wider transition-all duration-300",
                    isActive
                        ? "text-neon-red drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]"
                        : "text-gray-400 hover:text-neon-red hover:drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]"
                )}
            >
                <span className="relative z-10">
                    {item.icon ? (
                        <item.icon className={twMerge("w-5 h-5 transition-transform duration-300", isHovered ? "scale-110" : "")} />
                    ) : (
                        item.name
                    )}
                </span>

                {/* Hover Background Highlight */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            layoutId="nav-hover"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 z-0"
                            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                        />
                    )}
                </AnimatePresence>

                {/* Active Indicator Underline */}
                {isActive && (
                    <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-1 left-4 right-4 h-0.5 bg-neon-red shadow-[0_0_15px_#ff0033] z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
            </Link>
        </motion.div>
    );
}
