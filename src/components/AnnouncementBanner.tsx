import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import settingsData from '../data/settings.json';

export function AnnouncementBanner() {
    const [settings, setSettings] = useState(settingsData.announcement_banner);

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

    if (!settings?.enabled || !settings?.text) return null;

    return (
        <div
            className="fixed top-20 left-0 right-0 z-[95] h-8 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 overflow-hidden flex items-center"
            style={{ borderTop: `1px solid ${settings.color}33` }}
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
                                className="text-[10px] font-black uppercase tracking-[0.2em]"
                                style={{ color: settings.color }}
                            >
                                {settings.text}
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
                                className="text-[10px] font-black uppercase tracking-[0.2em]"
                                style={{ color: settings.color }}
                            >
                                {settings.text}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
