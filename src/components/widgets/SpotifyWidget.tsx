import { motion } from 'framer-motion';

export function SpotifyWidget() {
    return (
        <div className="space-y-8">
            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <span className="w-3 h-3 bg-neon-red rounded-full animate-pulse shadow-[0_0_15px_#ff0033]" />
                NOS PLAYLISTS
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    viewport={{ once: true }}
                    className="w-full relative group rounded-[24px] overflow-hidden"
                >
                    {/* Rotating Glow */}
                    <div className="absolute -inset-[100%] bg-[conic-gradient(from_0deg_at_50%_50%,#ff0033_0%,#bd00ff_25%,#ff0033_50%,#bd00ff_75%,#ff0033_100%)] animate-[spin_4s_linear_infinite] blur-[100px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <iframe
                        style={{ borderRadius: '24px' }}
                        src="https://open.spotify.com/embed/playlist/2SVXpg5Hqg853ZhuoI6Gqs?utm_source=generator&theme=0"
                        width="100%"
                        height="580"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="shadow-2xl border border-white/10 relative z-10 bg-black/80 backdrop-blur-sm"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="w-full relative group rounded-[24px] overflow-hidden"
                >
                    {/* Rotating Glow */}
                    <div className="absolute -inset-[100%] bg-[conic-gradient(from_0deg_at_50%_50%,#bd00ff_0%,#ff0033_25%,#bd00ff_50%,#ff0033_75%,#bd00ff_100%)] animate-[spin_4s_linear_infinite] blur-xl opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>

                    <iframe
                        style={{ borderRadius: '24px' }}
                        src="https://open.spotify.com/embed/playlist/0g1FJCiO5EguCDohLNftR9?utm_source=generator&theme=0"
                        width="100%"
                        height="580"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="shadow-2xl border border-white/10 relative z-10 bg-black/80 backdrop-blur-sm"
                    />
                </motion.div>
            </div>
        </div>
    );
}
