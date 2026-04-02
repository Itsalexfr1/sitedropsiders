import { Link } from 'react-router-dom';
import { Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { FlagIcon } from '../ui/FlagIcon';

interface MobileHeaderProps {
    onOpenSearch: () => void;
}

export function MobileHeader({ onOpenSearch }: MobileHeaderProps) {
    const { isDarkMode, toggleTheme } = useTheme();
    const { language, setLanguage } = useLanguage();


    return (
        <header className="fixed top-0 left-0 right-0 pt-safe bg-dark-bg/80 backdrop-blur-md z-[120] border-b border-white/10 lg:hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="h-16 px-4 flex items-center justify-between relative">
                {/* Glassy Overlay for extra premium feel */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                <Link to="/" className="relative flex items-center gap-2 active:scale-95 transition-transform duration-300 z-10">
                    <img
                        src="/Logo.png"
                        className={`h-6 w-auto object-contain logo-img transition-all duration-500 ${!isDarkMode ? 'invert brightness-0' : ''}`}
                        alt="DROPSIDERS"
                    />
                </Link>

            <div className="relative flex items-center gap-3 z-10">
                {/* Search Header Button */}
                <button
                    onClick={onOpenSearch}
                    className="p-1.5 text-gray-400 hover:text-neon-red transition-colors rounded-lg hover:bg-white/5"
                >
                    <Search className="w-5 h-5" />
                </button>

                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-1.5 text-gray-400 hover:text-neon-red transition-colors rounded-lg hover:bg-white/5"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>



                <div className="w-px h-4 bg-white/20" />

                {/* Language Toggle */}
                <div className="flex gap-1 bg-white/5 backdrop-blur-md border border-white/10 p-0.5 rounded-full pointer-events-auto">
                    <button
                        onClick={() => setLanguage('fr')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black transition-all ${language === 'fr' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FlagIcon location="France" className="w-3.5 h-2.5" />
                        <span>FR</span>
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black transition-all ${language === 'en' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <FlagIcon location="USA" className="w-3.5 h-2.5" />
                        <span>EN</span>
                    </button>
                </div>
                </div>
            </div>

        </header>
    );
}

