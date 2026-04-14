import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Disc, MapPin, Tent, LayoutGrid, List } from 'lucide-react';
import { WikiDropsiders } from '../community/WikiDropsiders';
import { WikiVenues } from '../community/WikiVenues';
import { twMerge } from 'tailwind-merge';

interface WikiWidgetProps {
    resolvedColor?: string;
    showResults?: boolean;
    hideTitle?: boolean;
}

export function WikiWidget({ resolvedColor = 'var(--color-neon-cyan)', showResults = false, hideTitle = false }: WikiWidgetProps) {
    const [activeTab, setActiveTab] = useState<'DJS' | 'CLUBS' | 'FESTIVALS'>('DJS');
    const [sortMode, setSortMode] = useState<'alpha' | 'votes'>('alpha');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const tabs = [
        { id: 'DJS', label: 'Wiki DJs', icon: Disc },
        { id: 'CLUBS', label: 'Clubs', icon: MapPin },
        { id: 'FESTIVALS', label: 'Festivals', icon: Tent }
    ] as const;

    return (
        <div className="w-full relative z-10 flex flex-col items-center">
            {/* Header / Title */}
            {!hideTitle && (
                <div className="text-center mb-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[60px] opacity-20 pointer-events-none" style={{ backgroundColor: resolvedColor }}></div>
                    <h2 className="text-3xl md:text-5xl font-display font-black text-white italic tracking-tighter uppercase relative z-10 flex items-center justify-center gap-3">
                        <Database className="w-8 h-8 md:w-10 md:h-10" style={{ color: resolvedColor }} />    
                        TOP <span style={{ color: resolvedColor }} className="drop-shadow-[0_0_15px_rgba(currentColor,0.5)]">DROPSIDERS</span>
                    </h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-lg mx-auto">
                        Le classement ultime des festivals, clubs et DJs du monde entier.
                    </p>
                </div>
            )}

            {/* Navigation Tabs & Sort Controls */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 relative z-10 mx-auto w-full max-w-4xl">
                <div className="flex bg-white/5 border border-white/10 rounded-full p-1.5 backdrop-blur-md overflow-x-auto max-w-full">
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
                            <tab.icon className={twMerge("w-4 h-4 relative z-10")} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-1.5 ml-auto">
                    <button 
                        onClick={() => setSortMode('alpha')}
                        className={twMerge(
                            "px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all",
                            sortMode === 'alpha' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Alphabétique
                    </button>
                    <button 
                        onClick={() => setSortMode('votes')}
                        className={twMerge(
                            "px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all",
                            sortMode === 'votes' ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Trier par Votes
                    </button>
                </div>
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-2xl p-1.5 ml-4">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={twMerge(
                            "p-2 rounded-xl transition-all",
                            viewMode === 'grid' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                        title="Vue Grille"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={twMerge(
                            "p-2 rounded-xl transition-all",
                            viewMode === 'list' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                        title="Vue Liste"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-4 md:p-8 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: resolvedColor }}></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: resolvedColor }}></div>

                <div className="relative z-10">
                    {activeTab === 'DJS' && <WikiDropsiders showResults={showResults} sortMode={sortMode} viewMode={viewMode} />}
                    {activeTab === 'CLUBS' && <WikiVenues initialMode="clubs" showResults={showResults} sortMode={sortMode} viewMode={viewMode} />}
                    {activeTab === 'FESTIVALS' && <WikiVenues initialMode="festivals" showResults={showResults} sortMode={sortMode} viewMode={viewMode} />}
                </div>
            </div>
        </div>
    );
}
