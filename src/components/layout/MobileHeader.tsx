import { Link } from 'react-router-dom';
import { Search, User, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function MobileHeader() {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-2xl z-[110] border-b border-white/5 px-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
                <img src="/Logo.png" className="h-6 w-auto object-contain logo-img" alt="DROPSIDERS" />
            </Link>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 active:text-neon-red transition-colors"
                >
                    <Heart className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-neon-red fill-neon-red'}`} />
                </button>
                <button className="p-2 text-gray-400 active:text-neon-red transition-colors">
                    <Search className="w-5 h-5" />
                </button>
                <Link to="/team" className="p-2 text-gray-400 active:text-neon-red transition-colors">
                    <User className="w-5 h-5" />
                </Link>
            </div>
        </header>
    );
}
