import { Link } from 'react-router-dom';
import { Search, User, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function MobileHeader() {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-3xl z-[120] border-b border-white/5 px-6 flex items-center justify-between lg:hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            {/* Glassy Overlay for extra premium feel */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

            <Link to="/" className="relative flex items-center gap-2 active:scale-95 transition-transform duration-300">
                <img
                    src="/Logo.png"
                    className={`h-6 w-auto object-contain logo-img transition-all duration-500 ${!isDarkMode ? 'invert brightness-0' : ''}`}
                    alt="DROPSIDERS"
                />
            </Link>

            <div className="relative flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="p-2.5 text-gray-400 active:text-neon-red active:scale-90 transition-all"
                    title="Toggle Theme"
                >
                    <Heart className={`w-5 h-5 transition-all duration-300 ${isDarkMode ? 'text-gray-400' : 'text-neon-red fill-neon-red drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]'}`} />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button className="p-2.5 text-gray-400 active:text-neon-red active:scale-90 transition-all">
                    <Search className="w-5 h-5" />
                </button>
                <Link to="/team" className="p-2.5 text-gray-400 active:text-neon-red active:scale-90 transition-all">
                    <User className="w-5 h-5" />
                </Link>
            </div>
        </header>
    );
}
