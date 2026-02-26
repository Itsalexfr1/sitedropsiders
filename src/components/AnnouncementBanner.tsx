import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import settingsData from '../data/settings.json';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

interface BannerSettings {
    enabled: boolean;
    text: string;
    text_en?: string;
    color: string;
    bgColor?: string;
    opacity?: number;
    size?: 'small' | 'medium' | 'large';
    link?: string;
}

export function AnnouncementBanner() {
    const { language } = useLanguage();
    const [settings, setSettings] = useState<BannerSettings>((settingsData as any).announcement_banner as BannerSettings);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    if (data.announcement_banner) {
                        setSettings(data.announcement_banner);
                    }
                }
            } catch (e) {
                // Keep default
            }
        };
        fetchSettings();

        // Check for updates every few minutes or on focus
        window.addEventListener('focus', fetchSettings);
        return () => window.removeEventListener('focus', fetchSettings);
    }, []);

    const bannerText = settings ? (language === 'en' && settings.text_en ? settings.text_en : settings.text) : '';

    if (!settings?.enabled || !bannerText) return null;

    const getHeight = () => {
        switch (settings.size) {
            case 'small': return 'h-6';
            case 'large': return 'h-12';
            default: return 'h-8';
        }
    };

    const getFontSize = () => {
        switch (settings.size) {
            case 'small': return 'text-[12px]';
            case 'large': return 'text-[16px]';
            default: return 'text-[14px]';
        }
    };

    const getBgStyle = () => {
        if (!settings.bgColor) return { backgroundColor: 'rgba(10, 10, 10, 0.8)' };

        // Fixed opacity to match Navbar (0.8)
        const opacity = 0.8;

        if (settings.bgColor.startsWith('#')) {
            const r = parseInt(settings.bgColor.slice(1, 3), 16);
            const g = parseInt(settings.bgColor.slice(3, 5), 16);
            const b = parseInt(settings.bgColor.slice(5, 7), 16);
            return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` };
        }
        return { backgroundColor: settings.bgColor };
    };

    const bannerContent = (
        <div
            className={`fixed top-20 left-0 right-0 z-[95] ${getHeight()} backdrop-blur-xl border-b border-white/5 overflow-hidden flex items-center shadow-lg transition-all duration-300`}
            style={{
                ...getBgStyle(),
                borderTop: `1px solid ${settings.color}33`
            }}
        >
            <div className="relative flex whitespace-nowrap">
                <motion.div
                    animate={{
                        x: [0, -1000],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 20,
                            ease: "linear",
                        },
                    }}
                    className="flex items-center gap-12 px-4"
                >
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span
                                className={`${getFontSize()} font-black uppercase tracking-[0.2em]`}
                                style={{ color: settings.color }}
                            >
                                {bannerText}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                        </div>
                    ))}
                </motion.div>
                {/* Duplicate for seamless loop */}
                <motion.div
                    animate={{
                        x: [0, -1000],
                    }}
                    transition={{
                        x: {
                            repeat: Infinity,
                            repeatType: "loop",
                            duration: 20,
                            ease: "linear",
                        },
                    }}
                    className="flex items-center gap-12 px-4"
                >
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <span
                                className={`${getFontSize()} font-black uppercase tracking-[0.2em]`}
                                style={{ color: settings.color }}
                            >
                                {bannerText}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );

    if (settings.link) {
        const isExternal = settings.link.startsWith('http');
        if (isExternal) {
            return (
                <a href={settings.link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                    {bannerContent}
                </a>
            );
        }
        return (
            <Link to={settings.link} className="block cursor-pointer">
                {bannerContent}
            </Link>
        );
    }

    return bannerContent;
}
