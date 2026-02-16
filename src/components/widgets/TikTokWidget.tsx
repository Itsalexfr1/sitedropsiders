import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';

export function TikTokWidget() {
    const playHoverSound = useHoverSound();

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onMouseEnter={playHoverSound}
            className="h-full bg-dark-bg/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl space-y-6"
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

            {/* Visual Feed Preview: Real-ish placeholders for @Dropsiders */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop", // Crowd
                    "https://images.unsplash.com/photo-1514525253361-bee243870eb2?q=80&w=400&auto=format&fit=crop", // DJ
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop", // Lights
                    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=400&auto=format&fit=crop", // Mainstage
                    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop", // Night
                    "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=400&auto=format&fit=crop"  // Close up
                ].map((img, i) => (
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
                        className="relative aspect-[3/4] rounded-lg overflow-hidden group border border-white/5 block"
                    >
                        <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-neon-cyan" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                            </svg>
                        </div>
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}
