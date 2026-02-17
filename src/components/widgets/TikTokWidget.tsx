import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useHoverSound } from '../../hooks/useHoverSound';

export function TikTokWidget() {
    const playHoverSound = useHoverSound();

    // ------------------------------------------------------------------
    // CONFIGURATION
    // ------------------------------------------------------------------
    const videos = [
        { id: '1', thumbnail: '/images/widgets/tiktok_1.jpg' },
        { id: '2', thumbnail: '/images/widgets/tiktok_2.jpg' },
        { id: '3', thumbnail: '/images/widgets/tiktok_3.jpg' },
        { id: '4', thumbnail: '/images/widgets/tiktok_4.jpg' },
        { id: '5', thumbnail: '/images/widgets/tiktok_5.jpg' },
        { id: '6', thumbnail: '/images/widgets/tiktok_6.jpg' },
        { id: '7', thumbnail: '/images/widgets/tiktok_7.jpg' },
        { id: '8', thumbnail: '/images/widgets/tiktok_8.jpg' },
        { id: '9', thumbnail: '/images/widgets/tiktok_9.jpg' }
    ];
    // ------------------------------------------------------------------

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onMouseEnter={playHoverSound}
            className="h-full bg-dark-bg/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl space-y-6 flex flex-col"
        >
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_10px_#00f0ff]" />
                    TIKTOK
                </h3>
            </div>

            {/* Profile Header */}
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-cyan to-neon-blue p-[2px]">
                        <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center overflow-hidden">
                            <img src="/Logo.png" alt="Dropsiders" className="w-6 h-6 object-contain" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm leading-none">Dropsiders</h4>
                        <p className="text-gray-400 text-[10px] mt-1">@dropsiders.eu</p>
                    </div>
                </div>
                <a
                    href="https://www.tiktok.com/@dropsiders.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-dark-bg border border-neon-cyan text-neon-cyan text-[10px] font-bold rounded-full hover:bg-neon-cyan hover:text-dark-bg transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                >
                    Suivre
                </a>
            </div>

            {/* Visual Feed Preview: Grid */}
            <div className="grid grid-cols-3 gap-2 flex-1 content-start">
                {videos.map((video, i) => (
                    <motion.a
                        key={i}
                        href="https://www.tiktok.com/@dropsiders.eu"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        onMouseEnter={(e) => {
                            e.stopPropagation();
                            playHoverSound();
                        }}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden group border border-white/5 cursor-pointer block"
                    >
                        <img
                            src={video.thumbnail}
                            alt="TikTok thumbnail"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Play className="w-8 h-8 fill-neon-cyan text-neon-cyan" />
                        </div>
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}
