import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Disc, ExternalLink, ListMusic, TrendingUp } from 'lucide-react';
import { EqualizerLoader } from '../components/ui/EqualizerLoader';
import { GlitchTransition } from '../components/ui/GlitchTransition';

export function Musique() {
    const [activeTab, setActiveTab] = useState('beatport');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const platforms = [
        { id: 'beatport', name: 'Beatport Top 10', icon: Music, color: '#39ff14' },
        { id: 'traxsource', name: 'Traxsource Top 10', icon: Disc, color: '#ffaa00' },
        { id: 'juno', name: 'Juno Download Top 10', icon: ListMusic, color: '#00f0ff' },
        { id: '1001tracklists', name: '1001Tracklists', icon: TrendingUp, color: '#ff0033' },
    ];

    const getMockData = (platform: string) => {
        if (platform === 'beatport') {
            return [
                { id: 'bp-1', rank: 1, title: 'neck (Extended Mix)', artist: 'Mau P', label: 'Repopulate Mars', url: 'https://www.beatport.com/track/neck/18654321' },
                { id: 'bp-2', rank: 2, title: 'Make My Day (Original Mix)', artist: 'ESSE (US)', label: 'SOLOTOKO', url: '#' },
                { id: 'bp-3', rank: 3, title: 'Loco Loco (Extended Mix)', artist: 'Reinier Zonneveld, GORDO (US)', label: 'Filth on Acid', url: '#' },
                { id: 'bp-4', rank: 4, title: 'Out of My Mind (Extended Mix)', artist: 'Joshwa', label: 'Insomniac Records', url: '#' },
                { id: 'bp-5', rank: 5, title: 'Good Time (Extended Mix)', artist: 'Trace (UZ)', label: 'Sink or Swim', url: '#' },
                { id: 'bp-6', rank: 6, title: 'Just Like That (Original Mix)', artist: 'SOSA (UK)', label: 'COCO', url: '#' },
                { id: 'bp-7', rank: 7, title: 'Swagger (Extended)', artist: 'HILLS (US), WELKER (BR)', label: 'HITS HARD', url: '#' },
                { id: 'bp-8', rank: 8, title: 'Jamaican (Bam Bam) (Extended Mix)', artist: 'Hugel, SOLTO (FR)', label: 'Sony Music', url: '#' },
                { id: 'bp-9', rank: 9, title: 'Never Alone (Extended Mix)', artist: 'Odd Mob, Lizzy Land', label: 'Tinted Records', url: '#' },
                { id: 'bp-10', rank: 10, title: 'Vision Blurred (Extended Mix)', artist: 'Kaskade, CID, Anabel Englund', label: 'Arkade', url: '#' },
            ];
        }
        if (platform === 'traxsource') {
            return [
                { id: 'ts-1', rank: 1, title: 'No Hesitating (Max Dean Remix)', artist: 'Joe Rolét', label: 'Solid Grooves', url: '#' },
                { id: 'ts-2', rank: 2, title: 'Positive (Extended Mix)', artist: 'Jamback', label: 'Piv', url: '#' },
                { id: 'ts-3', rank: 3, title: 'The Feeling', artist: 'Adam Port, Stryv', label: 'Keinemusik', url: '#' },
                { id: 'ts-4', rank: 4, title: 'Move', artist: 'Keinemusik', label: 'Keinemusik', url: '#' },
                { id: 'ts-5', rank: 5, title: 'Shiver', artist: 'John Summit', label: 'Experts Only', url: '#' },
                { id: 'ts-6', rank: 6, title: 'Honey', artist: 'Anyma', label: 'Afterlife', url: '#' },
                { id: 'ts-7', rank: 7, title: 'Dominos', artist: 'Vintage Culture', label: 'BOMA', url: '#' },
                { id: 'ts-8', rank: 8, title: 'Mwaki', artist: 'Zerb', label: 'Sthlm', url: '#' },
                { id: 'ts-9', rank: 9, title: 'Control', artist: 'Mochakk', label: 'CircoLoco', url: '#' },
                { id: 'ts-10', rank: 10, title: 'Beat Goes On', artist: 'Cloonee', label: 'Hellbent', url: '#' },
            ];
        }
        if (platform === '1001tracklists') {
            return [
                { id: '1001-1', rank: 1, title: 'ALESSA.A @ TOMORROWLAND 2026', artist: 'ALESSA.A', label: 'MAINSTAGE', url: '#' },
                { id: '1001-2', rank: 2, title: 'DAVID GUETTA @ ULTRA MIAMI 2026', artist: 'DAVID GUETTA', label: 'MAIN STAGE', url: '#' },
                { id: '1001-3', rank: 3, title: 'FISHER @ COACHELLA 2026', artist: 'FISHER', label: 'OUTDOOR STAGE', url: '#' },
                { id: '1001-4', rank: 4, title: 'ANYMA @ SPHERE LAS VEGAS', artist: 'ANYMA', label: 'AFTERLIFE', url: '#' },
                { id: '1001-5', rank: 5, title: 'CHARLOTTE DE WITTE @ AWAKENINGS', artist: 'CHARLOTTE DE WITTE', label: 'KNTXT', url: '#' },
                { id: '1001-6', rank: 6, title: 'VINTAGE CULTURE @ HI IBIZA', artist: 'VINTAGE CULTURE', label: 'THEATRE', url: '#' },
                { id: '1001-7', rank: 7, title: 'FRED AGAIN.. @ READING 2026', artist: 'FRED AGAIN..', label: 'MAIN STAGE', url: '#' },
                { id: '1001-8', rank: 8, title: 'MAU P @ SPACE MIAMI', artist: 'MAU P', label: 'TERRACE', url: '#' },
                { id: '1001-9', rank: 9, title: 'DOM DOLLA @ PARLOUX', artist: 'DOM DOLLA', label: 'CLUB', url: '#' },
                { id: '1001-10', rank: 10, title: 'CARL COX @ RESISTANCE', artist: 'CARL COX', label: 'MEGASTRUCTURE', url: '#' },
            ];
        }
        return Array.from({ length: 10 }, (_, i) => ({
            id: `${platform}-${i}`,
            rank: i + 1,
            title: i === 0 ? 'What You Want' : `Electronic Anthem #${i + 1}`,
            artist: i === 0 ? 'Justice, Angèle' : `Producer ${i + 1}`,
            label: `Record Label ${i + 1}`,
            url: '#'
        }));
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 md:px-12 xl:px-16 2xl:px-24 bg-[#050505]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12 relative"
            >
                <GlitchTransition trigger={activeTab} />

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <EqualizerLoader count={8} className="scale-75 opacity-50" />
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
                        TRACKS <span className="text-neon-red">STUDIO</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-xs md:text-sm font-black uppercase tracking-[0.3em]">
                        LES CHARTS LES PLUS INFLUENTS DE LA PLANÈTE
                    </p>
                </div>

                {/* Platform Selector */}
                <div className="flex flex-wrap justify-center gap-3">
                    {platforms.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setActiveTab(p.id)}
                            className={`group relative flex items-center gap-3 px-8 py-5 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${activeTab === p.id
                                ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                                : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {activeTab === p.id && (
                                <motion.div
                                    layoutId="music-tab-glow"
                                    className="absolute inset-0 opacity-20"
                                    style={{ backgroundColor: p.color }}
                                />
                            )}
                            <p.icon className={`w-5 h-5 relative z-10 ${activeTab === p.id ? 'animate-pulse' : ''}`} />
                            <span className="font-black text-[10px] uppercase tracking-widest relative z-10">{p.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content List */}
                <div className="relative min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                            >
                                <EqualizerLoader count={12} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neon-cyan animate-pulse">
                                    SYNCHRONISATION...
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid lg:grid-cols-1 gap-3"
                            >
                                {getMockData(activeTab).map((track, i) => (
                                    <motion.div
                                        key={track.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
                                    >
                                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                            <div className="absolute inset-0 bg-white/5 rounded-2xl rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                                            <span className="relative text-2xl font-black italic text-white/10 group-hover:text-neon-red transition-colors">
                                                {track.rank}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight truncate group-hover:text-neon-red transition-colors">
                                                {track.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">
                                                    {track.artist}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                    {track.label}
                                                </span>
                                            </div>
                                        </div>

                                        <a
                                            href={track.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-neon-red hover:border-neon-red hover:text-white transition-all group/btn"
                                        >
                                            <ExternalLink className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        </a>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Info */}
                <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                        {platforms.map(p => (
                            <div key={p.id} className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all opacity-30 hover:opacity-100">
                                <p.icon className="w-4 h-4" />
                                <span className="text-[8px] font-black uppercase tracking-widest">{p.id}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">
                        DATA UPDATE EVERY 24H • DROPSIDERS NETWORK 2026
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default Musique;

