import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Disc, MapPin, Tent } from 'lucide-react';
import { WikiDropsiders } from '../community/WikiDropsiders';
import { WikiVenues } from '../community/WikiVenues';
import { twMerge } from 'tailwind-merge';

interface WikiWidgetProps {
    accentColor?: string;
    resolvedColor?: string;
}

export function WikiWidget({ accentColor = 'cyan', resolvedColor = 'var(--color-neon-cyan)' }: WikiWidgetProps) {
    const [activeTab, setActiveTab] = useState<'DJS' | 'CLUBS' | 'FESTIVALS'>('DJS');

    const tabs = [
        { id: 'DJS', label: 'Wiki DJs', icon: Disc },
        { id: 'CLUBS', label: 'Clubs', icon: MapPin },
        { id: 'FESTIVALS', label: 'Festivals', icon: Tent }
    ] as const;

    return (
        <div className="w-full relative z-10 flex flex-col items-center">
            {/* Header / Title */}
            <div className="text-center mb-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] opacity-20 pointer-events-none" style={{ backgroundColor: resolvedColor }}></div>
                <h2 className="text-3xl md:text-5xl font-display font-black text-white italic tracking-tighter uppercase relative z-10 flex items-center justify-center gap-3">
                    <Database className="w-8 h-8 md:w-10 md:h-10" style={{ color: resolvedColor }} />    
                    L'ENCYCLOPÉDIE <span style={{ color: resolvedColor }} className="drop-shadow-[0_0_15px_rgba(currentColor,0.5)]">DROPSIDERS</span>
                </h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-lg mx-auto">
                    Découvrez, votez et explorez la plus grande base de données des festivals, clubs et DJs du monde.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-white/5 border border-white/10 rounded-full p-1.5 mb-8 backdrop-blur-md relative z-10 mx-auto overflow-x-auto max-w-full">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={twMerge(
                            "flex items-center gap-2 px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all relative",
                            activeTab === tab.id ? "text-black" : "text-white/40 hover:text-white"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="wiki-widget-tab"
                                className="absolute inset-0 bg-white shadow-lg"
                                style={{ borderRadius: '9999px', boxShadow: `0 0 20px ${resolvedColor}40` }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className={twMerge("w-4 h-4 relative z-10", activeTab === tab.id ? "" : "")} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-4 md:p-8 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: resolvedColor }}></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: resolvedColor }}></div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10"
                    >
                        {activeTab === 'DJS' && <WikiDropsiders />}
                        {activeTab === 'CLUBS' && <WikiVenues initialMode="clubs" />}
                        {activeTab === 'FESTIVALS' && <WikiVenues initialMode="festivals" />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
