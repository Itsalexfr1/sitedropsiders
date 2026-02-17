import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Sun, Moon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useHoverSound } from '../../hooks/useHoverSound';
import newsData from '../../data/news.json';
import recapsData from '../../data/recaps.json';
import agendaData from '../../data/agenda.json';
import { useLanguage } from '../../context/LanguageContext';
import { getArticleLink } from '../../utils/slugify';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const playHoverSound = useHoverSound();
    const { language, setLanguage, t } = useLanguage();

    const navItems = [
        { name: t('nav.news'), path: '/news' },
        { name: t('nav.recaps'), path: '/recaps' },
        { name: t('nav.galleries'), path: '/galerie' },
        { name: t('nav.interviews'), path: '/interviews' },
        { name: t('nav.agenda'), path: '/agenda' },
        { name: t('nav.team'), path: '/team' },
    ];

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        // Toggle dark mode class on document
        document.documentElement.classList.toggle('light-mode');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'en' : 'fr');
    };

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();

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
                item.genre?.toLowerCase().includes(query)
            );

        return [...filteredNews, ...filteredRecaps, ...filteredAgenda]
            .slice(0, 10); // Limit to 10 results
    }, [searchQuery]);

    const handleSearchResultClick = (item: any) => {
        let path = '';
        const searchType = item.searchType || item.category?.toLowerCase();

        if (searchType === 'news' || searchType === 'interview') {
            path = getArticleLink(item);
        }
        else if (searchType === 'recap') path = `/recaps/${item.id}`;
        else if (searchType === 'agenda') path = `/agenda?event=${item.id}`;
        else if (searchType === 'galerie') path = `/galerie/${item.id}`;

        if (path) navigate(path);
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-bg/40 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center group py-2">
                        <img
                            src="/Logo.png"
                            alt="DROPSIDERS"
                            className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </Link>

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

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onMouseEnter={playHoverSound}
                            onClick={toggleLanguage}
                            className="p-1 px-2 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center"
                            title={language === 'fr' ? 'Switch to English' : 'Passer en Français'}
                        >
                            <img
                                src={language === 'fr' ? "https://flagcdn.com/w40/fr.png" : "https://flagcdn.com/w40/gb.png"}
                                alt={language === 'fr' ? "Français" : "English"}
                                className="w-6 h-auto rounded-sm shadow-sm"
                            />
                        </motion.button>

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
                                            onClick={() => setIsSearchOpen(false)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

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
                                                                <span className="text-[10px] font-black text-neon-red uppercase tracking-widest bg-neon-red/10 px-2 py-0.5 rounded">
                                                                    {item.category}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 font-bold">
                                                                    {item.date}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-neon-red transition-colors">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                                                {item.summary}
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
                        className="md:hidden bg-dark-bg/95 border-b border-white/10 overflow-hidden"
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
        </nav>
    );
}

interface NavItemProps {
    item: { name: string; path: string };
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
                <span className="relative z-10">{item.name}</span>

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
