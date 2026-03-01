import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Disc, ExternalLink, ListMusic, TrendingUp } from 'lucide-react';

interface MusicTrack {
    id: string;
    title: string;
    artist: string;
    label?: string;
    rank: number;
    platform: string;
}

export function Musique() {
    const [activeTab, setActiveTab] = useState('beatport');

    // Mock data for initial "wow" effect
    const mockTop10 = (platform: string) => Array.from({ length: 10 }, (_, i) => ({
        id: `${platform}-${i}`,
        rank: i + 1,
        title: `Track Title ${i + 1}`,
        artist: `Artist name ${i + 1}`,
        label: `Label ${i + 1}`,
        platform
    }));

    const platforms = [
        { id: 'beatport', name: 'Beatport Top 10', icon: Music },
        { id: 'traxsource', name: 'Traxsource Top 10', icon: Disc },
        { id: 'juno', name: 'Juno Download Top 10', icon: ListMusic },
        { id: '1001tracklists', name: '1001Tracklists', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-12 xl:px-16 2xl:px-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12"
            >
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">
                        LA <span className="text-neon-cyan">MUSIQUE</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium">
                        Retrouvez les derniers classements des meilleures plateformes et les tracklists les plus consultées.
                    </p>
                </div>

                {/* Platform Selector */}
                <div className="flex flex-wrap justify-center gap-4">
                    {platforms.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setActiveTab(p.id)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${activeTab === p.id
                                    ? 'bg-neon-cyan border-neon-cyan text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                }`}
                        >
                            <p.icon className={`w-5 h-5 ${activeTab === p.id ? 'animate-spin-slow' : ''}`} />
                            <span className="font-black text-xs uppercase tracking-wider">{p.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content List */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 border border-white/10 rounded-[40px] p-4 md:p-8 backdrop-blur-xl"
                >
                    <div className="grid gap-2">
                        {mockTop10(activeTab).map((track, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={track.id}
                                className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                            >
                                <span className="text-2xl font-black italic text-white/20 group-hover:text-neon-cyan transition-colors w-12 shrink-0">
                                    #{track.rank}
                                </span>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white uppercase truncate group-hover:text-neon-cyan transition-colors">
                                        {track.title}
                                    </h3>
                                    <p className="text-gray-500 text-xs font-medium uppercase tracking-tight">
                                        {track.artist} • {track.label}
                                    </p>
                                </div>

                                <button className="p-3 bg-white/5 rounded-xl hover:bg-neon-cyan hover:text-black transition-all group/btn">
                                    <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Info Text */}
                <p className="text-center text-gray-600 text-[10px] font-medium uppercase tracking-widest">
                    Mise à jour toutes les 24h • Sources : Beatport, Traxsource, Juno, 1001Tracklists
                </p>
            </motion.div>
        </div>
    );
}

