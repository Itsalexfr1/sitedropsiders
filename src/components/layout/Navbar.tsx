import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sun, Moon, Filter, Shield, Instagram, Facebook, Video, User, ShoppingBag, Trophy as TopIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useHoverSound } from '../../hooks/useHoverSound';
import { useUser } from '../../context/UserContext';
import { UserAuthModal } from '../auth/UserAuthModal';

import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

import { getArticleLink, getRecapLink, getAgendaLink, getGalleryLink } from '../../utils/slugify';
import { FlagIcon } from '../ui/FlagIcon';
import { resolveImageUrl } from '../../utils/image';
import settings from '../../data/settings.json';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const playHoverSound = useHoverSound();
    const { language, setLanguage, t } = useLanguage();
    const [shopEnabled, setShopEnabled] = useState(settings.shop_enabled);
    const [shopPasswordProtected, setShopPasswordProtected] = useState((settings as any).shop_password_protected || false);
    const [takeoverEnabled, setTakeoverEnabled] = useState(settings.takeover?.enabled || false);
    const [takeoverSettings, setTakeoverSettings] = useState(settings.takeover);
    const [navLabels, setNavLabels] = useState((settings as any).nav_labels || {});
    const isMobile = window.innerWidth < 1024;
    const [isAdmin, setIsAdmin] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const { isLoggedIn, user } = useUser();
    const [newsData, setNewsData] = useState<any[]>([]);
    const [recapsData, setRecapsData] = useState<any[]>([]);
    const [agendaData, setAgendaData] = useState<any[]>([]);
    const [isSearchDataFetched, setIsSearchDataFetched] = useState(false);

    useEffect(() => {
        if (isSearchOpen && !isSearchDataFetched) {
            const fetchSearchData = async () => {
                try {
                    const [newsRes, recapsRes, agendaRes] = await Promise.all([
                        fetch('/api/news'),
                        fetch('/api/recaps'),
                        fetch('/api/agenda')
                    ]);
                    if (newsRes.ok) setNewsData(await newsRes.json());
                    if (recapsRes.ok) setRecapsData(await recapsRes.json());
                    if (agendaRes.ok) setAgendaData(await agendaRes.json());
                    setIsSearchDataFetched(true);
                } catch (e) {
                    console.error('Failed to fetch search data', e);
                }
            };
            fetchSearchData();
        }
    }, [isSearchOpen, isSearchDataFetched]);

    useEffect(() => {
        if (isMobile) return;
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
                    if (data.takeover) {
                        setTakeoverEnabled(data.takeover.enabled);
                        setTakeoverSettings(data.takeover);
                    }
                    if (data.nav_labels) {
                        setNavLabels(data.nav_labels);
                    }
                }
            } catch (e: any) {
                // Keep default
            }
        };
        fetchSettings();
    }, []);

    const navItems = [
        { name: navLabels.news || t('nav.news'), path: '/news', color: 'neon-red' },
        { name: navLabels.vols || t('nav.vols'), path: '/voyage/vols', color: 'neon-green' },
        { name: navLabels.recaps || t('nav.recaps'), path: '/recaps', color: 'neon-purple' },
        { name: navLabels.agenda || t('nav.agenda'), path: '/agenda', color: 'neon-cyan' },
        { name: navLabels.communaute || t('nav.communaute'), path: '/communaute', color: 'neon-pink' },
        { name: 'TOP', path: '/communaute?tab=GUIDE', color: 'neon-yellow', suffix: 'DROPSIDERS', isPremium: true },
        { name: navLabels.interviews || t('nav.interviews'), path: '/interviews', color: 'neon-blue' },
        { name: navLabels.team || t('nav.team'), path: '/team', color: 'neon-yellow' },
        ...(shopEnabled && !shopPasswordProtected ? [{ name: '', path: '/shop', color: 'neon-red', icon: ShoppingBag, isIconOnly: true }] : []),
        ...(((takeoverEnabled && (takeoverSettings as any)?.status === 'live')) && ((takeoverSettings as any)?.showInNavbar !== false) ? [{
            name: 'LIVE',
            path: '/live',
            icon: Video,
            isLive: true,
            color: 'neon-red',
            onClick: () => {
                sessionStorage.removeItem('exited_live');
            }
        }] : []),
    ];



    const searchResults = useMemo(() => {
        if (isMobile || !searchQuery.trim() || !isSearchDataFetched) return [];

        let query = searchQuery.toLowerCase();
        if (query === 'multistyle') query = 'multi-';

        const filteredNews = (newsData || [])
            .map(item => ({ ...item, searchType: (item.category || '').toLowerCase() }))
            .filter((item: any) =>
                item.title?.toLowerCase().includes(query) ||
                item.summary?.toLowerCase().includes(query)
            );

        const filteredRecaps = (recapsData || [])
            .map(item => ({ ...item, searchType: 'recap', category: 'Recaps' }))
            .filter((item: any) =>
                item.title?.toLowerCase().includes(query) ||
                item.festival?.toLowerCase().includes(query)
            );

        const filteredAgenda = (agendaData || [])
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
    }, [searchQuery, newsData, recapsData, agendaData, isSearchDataFetched]);

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
        <nav className="hidden lg:block fixed top-0 left-0 right-0 z-[100] bg-dark-bg/80 backdrop-blur-xl border-b border-white/10">
            <div className="w-full px-2 md:px-4 xl:px-6 2xl:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Logo */}
                        <Link
                            to="/"
                            onClick={() => {
                                sessionStorage.setItem('exited_live', 'true');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center group py-2 lg:relative lg:left-0 absolute left-1/2 -translate-x-1/2 lg:translate-x-0"
                        >
                            <img
                                src="/Logo.png"
                                alt="DROPSIDERS"
                                className="logo-img h-8 md:h-12 w-auto max-w-[120px] md:max-w-none object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>

                        {/* Social Icons - Stacked vertically next to logo */}
                        <div className="hidden lg:flex flex-col items-center gap-1.5 py-1 border-l border-white/10 pl-3">
                            <a
                                href={`https://instagram.com/dropsiders.eu`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/20 hover:text-white transition-all transform hover:scale-110"
                                title="Instagram"
                            >
                                <Instagram className="w-3.5 h-3.5" />
                            </a>
                            <a
                                href={`https://tiktok.com/@dropsiders.eu`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/20 hover:text-white transition-all transform hover:scale-110"
                                title="TikTok"
                            >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18.77a7.658 7.658 0 0 1-5.69 7.42c-1.39.4-2.87.5-4.28.28-1.4-.21-2.77-.73-3.95-1.54A7.784 7.784 0 0 1 .15 20.32c-.52-1.48-.68-3.08-.47-4.63.19-1.4.74-2.77 1.58-3.95A7.74 7.74 0 0 1 5.46 8.78c1.37-.58 2.87-.78 4.35-.59v4.16c-1.12-.2-2.3.06-3.23.69-.93.63-1.52 1.62-1.63 2.74-.11 1.12.33 2.22 1.05 3.03.72.82 1.76 1.3 2.86 1.35 1.15.05 2.3-.39 3.07-1.23.63-.7.88-1.61.88-2.51V.02z" />
                                </svg>
                            </a>
                            <a
                                href={`https://www.facebook.com/dropsidersfr`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/20 hover:text-white transition-all transform hover:scale-110"
                                title="Facebook"
                            >
                                <Facebook className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
                        {navItems.map((item) => (
                            <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
                        ))}
                    </div>


                    {/* Right Side Actions */}
                    <div className="flex items-center gap-1 xl:gap-3 shrink-0">
                        {/* Search & Theme Group */}
                        <div className="hidden xl:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl backdrop-blur-md">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onMouseEnter={playHoverSound}
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 text-gray-400 hover:text-neon-red transition-colors rounded-xl hover:bg-white/5"
                                title="Rechercher"
                            >
                                <Search className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onMouseEnter={playHoverSound}
                                onClick={toggleTheme}
                                className="p-2 text-gray-400 hover:text-neon-red transition-colors rounded-xl hover:bg-white/5"
                                title="Thème"
                            >
                                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </motion.button>
                        </div>

                        {/* Language Selector */}
                        <div className="flex gap-1 bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-full">
                            <button
                                onClick={() => setLanguage('fr')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black transition-all ${language === 'fr' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FlagIcon location="France" className="w-3 h-2" />
                                <span className="hidden 2xl:block">FR</span>
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black transition-all ${language === 'en' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                <FlagIcon location="USA" className="w-3 h-2" />
                                <span className="hidden 2xl:block">EN</span>
                            </button>
                        </div>

                        {/* LE CADRE COMPTE - High Visibility */}
                        <div className="flex items-center gap-1 bg-gradient-to-r from-neon-red/10 to-neon-purple/10 backdrop-blur-2xl border border-white/20 p-1.5 rounded-[1.5rem] shadow-[0_0_30px_rgba(0,0,0,0.3)] ring-1 ring-white/5 px-2">
                            {/* Account Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onMouseEnter={playHoverSound}
                                onClick={() => setIsUserModalOpen(true)}
                                className={twMerge(
                                    "px-4 py-2.5 transition-all rounded-xl flex items-center gap-2 group",
                                    isLoggedIn ? "bg-neon-red text-white shadow-[0_0_20px_rgba(255,18,65,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/10"
                                )}
                                title={isLoggedIn ? `Compte (${user?.username})` : "Connexion"}
                            >
                                <div className="relative">
                                    <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    {isLoggedIn && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                    )}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">
                                    {isLoggedIn ? user?.username : 'Compte'}
                                </span>
                            </motion.button>

                        </div>

                        {isAdmin && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onMouseEnter={playHoverSound}
                                onClick={() => navigate('/admin')}
                                className="p-3 bg-neon-red text-white border border-neon-red/20 rounded-2xl shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-all"
                                title="Administration"
                            >
                                <Shield className="w-5 h-5" />
                            </motion.button>
                        )}
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
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors group/clear"
                                        >
                                            <X className="w-4 h-4 text-white hover:text-neon-red transition-colors" />
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
                                                                src={resolveImageUrl(item.image)}
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
            <UserAuthModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
            />
        </nav >
    );
}

interface NavItemProps {
    item: { 
        name: string; 
        path: string; 
        icon?: any; 
        isLive?: boolean; 
        color?: string; 
        suffix?: string; 
        isPremium?: boolean;
        isIconOnly?: boolean;
        onClick?: () => void;
    };
    isActive: boolean;
}

const getThemeColor = (colorClass: string) => {
    switch (colorClass) {
        case 'neon-red': return 'rgba(255, 18, 65, 0.15)';
        case 'neon-green': return 'rgba(57, 255, 20, 0.15)';
        case 'neon-purple': return 'rgba(191, 0, 255, 0.15)';
        case 'neon-cyan': return 'rgba(34, 211, 238, 0.15)';
        case 'neon-pink': return 'rgba(255, 0, 153, 0.15)';
        case 'neon-blue': return 'rgba(0, 191, 255, 0.15)';
        case 'neon-yellow': return 'rgba(255, 240, 31, 0.15)';
        default: return 'rgba(255, 255, 255, 0.1)';
    }
};

const getThemeBorder = (colorClass: string) => {
    switch (colorClass) {
        case 'neon-red': return 'rgba(255, 18, 65, 0.3)';
        case 'neon-green': return 'rgba(57, 255, 20, 0.3)';
        case 'neon-purple': return 'rgba(191, 0, 255, 0.3)';
        case 'neon-cyan': return 'rgba(34, 211, 238, 0.3)';
        case 'neon-pink': return 'rgba(255, 0, 153, 0.3)';
        case 'neon-blue': return 'rgba(0, 191, 255, 0.3)';
        case 'neon-yellow': return 'rgba(255, 240, 31, 0.3)';
        default: return 'rgba(255, 255, 255, 0.2)';
    }
};

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
                data-cursor-color={item.color}
                onClick={() => {
                    if ((item as any).onClick) (item as any).onClick();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={twMerge(
                    "relative block px-2.5 xl:px-4 py-2 text-[11px] xl:text-sm font-bold tracking-wider transition-all duration-300 rounded-xl",
                    item.isPremium ? "border border-neon-yellow/20 bg-neon-yellow/5 shadow-[0_0_15px_rgba(255,240,31,0.05)]" : "",
                    isActive
                        ? (item.color === 'neon-green' ? "text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" :
                            item.color === 'neon-purple' ? "text-neon-purple drop-shadow-[0_0_8px_rgba(191,0,255,0.5)]" :
                                item.color === 'neon-cyan' ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" :
                                    item.color === 'neon-pink' ? "text-neon-pink drop-shadow-[0_0_8px_rgba(255,0,153,0.5)]" :
                                        item.color === 'neon-blue' ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,191,255,0.5)]" :
                                            item.color === 'neon-yellow' ? "text-neon-yellow drop-shadow-[0_0_8px_rgba(255,240,31,0.5)]" :
                                                "text-neon-red drop-shadow-[0_0_8px_rgba(255,18,65,0.5)]")
                        : "text-gray-400 hover:text-white"
                )}
            >
                <span className={twMerge(
                    "relative z-10 flex items-center gap-2 whitespace-nowrap",
                    item.isPremium ? "font-black" : ""
                )}>
                    {item.icon ? (
                        <div className={twMerge(
                            "relative flex items-center justify-center",
                            item.isIconOnly ? "w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-neon-red/10 hover:border-neon-red/20 transition-all" : ""
                        )}>
                            <item.icon className={twMerge(
                                item.isIconOnly ? "w-5 h-5" : "w-5 h-5",
                                "transition-transform duration-300",
                                isHovered ? "scale-110" : "",
                                item.isLive ? "text-neon-red drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]" : ""
                            )} />
                            {item.isLive && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.8)]" />
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            {item.isPremium && <TopIcon className="w-3.5 h-3.5 text-neon-yellow" />}
                            <span className={item.isPremium ? "text-neon-yellow" : ""}>{item.name}</span>
                            {item.suffix && <span className="text-[10px] opacity-40 font-bold ml-0.5">{item.suffix}</span>}
                        </div>
                    )}
                    {item.isLive && (
                        <span className="text-[10px] font-black tracking-tighter text-neon-red animate-pulse">
                            LIVE
                        </span>
                    )}
                </span>
                {/* Sliding Glass Background - Hover & Active */}
                {(isHovered || isActive) && (
                    <motion.div
                        layoutId="nav-sliding-glass"
                        initial={false}
                        animate={{
                            backgroundColor: getThemeColor(item.color || ''),
                            borderColor: getThemeBorder(item.color || ''),
                            opacity: 1
                        }}
                        className={twMerge(
                            "absolute inset-0 rounded-xl border backdrop-blur-md z-0 shadow-lg",
                            isActive ? "shadow-[0_0_20px_rgba(0,0,0,0.2)]" : ""
                        )}
                        transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6
                        }}
                    />
                )}

                {/* Active Underline - Extra accent */}
                {isActive && (
                    <motion.div
                        layoutId="navbar-indicator-accent"
                        className={twMerge(
                            "absolute -bottom-1 left-4 right-4 h-0.5 z-10",
                            item.color === 'neon-green' ? "bg-neon-green shadow-[0_0_15px_rgba(57,255,20,0.8)]" :
                            item.color === 'neon-purple' ? "bg-neon-purple shadow-[0_0_15px_rgba(191,0,255,0.8)]" :
                            item.color === 'neon-cyan' ? "bg-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.8)]" :
                            item.color === 'neon-pink' ? "bg-neon-pink shadow-[0_0_15px_rgba(255,0,153,0.8)]" :
                            item.color === 'neon-blue' ? "bg-neon-blue shadow-[0_0_15px_rgba(0,191,255,0.8)]" :
                            item.color === 'neon-yellow' ? "bg-neon-yellow shadow-[0_0_15px_rgba(255,240,31,0.8)]" :
                            "bg-neon-red shadow-[0_0_15px_rgba(255,18,65,0.8)]"
                        )}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
            </Link>
        </motion.div>
    );
}
