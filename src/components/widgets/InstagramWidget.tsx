import { InstagramEmbed } from 'react-social-media-embed';
import { Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHoverSound } from '../../hooks/useHoverSound';

export function InstagramWidget() {
    const playHoverSound = useHoverSound();

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onMouseEnter={playHoverSound}
            className="bg-dark-bg/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl space-y-6 flex flex-col items-center transition-all duration-300"
        >
            <div className="w-full flex justify-between items-center mb-2">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-neon-pink rounded-full animate-pulse shadow-[0_0_10px_#ff0099]" />
                    INSTAGRAM
                </h3>
                <Share2 className="w-4 h-4 text-gray-500 hover:text-neon-pink transition-colors" />
            </div>

            <div className="w-full flex-1 relative group rounded-xl overflow-hidden border border-neon-pink/20 p-[1px] bg-gradient-to-r from-neon-pink/50 via-transparent to-neon-purple/50">
                <div className="h-full bg-dark-bg rounded-[11px] overflow-hidden">
                    <div className="h-full w-full flex justify-center py-2 px-2">
                        <InstagramEmbed
                            url="https://www.instagram.com/dropsiders.eu/"
                            width="100%"
                            style={{ borderRadius: '12px', height: '100%' }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
