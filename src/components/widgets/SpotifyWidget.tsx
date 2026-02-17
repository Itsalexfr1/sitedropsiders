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
                    className="w-full transition-all duration-300"
                >
                    <iframe
                        style={{ borderRadius: '24px' }}
                        src="https://open.spotify.com/embed/playlist/2SVXpg5Hqg853ZhuoI6Gqs?utm_source=generator&theme=0"
                        width="100%"
                        height="580"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="shadow-2xl border border-white/10"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="w-full transition-all duration-300"
                >
                    <iframe
                        style={{ borderRadius: '24px' }}
                        src="https://open.spotify.com/embed/playlist/0g1FJCiO5EguCDohLNftR9?utm_source=generator&theme=0"
                        width="100%"
                        height="580"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="shadow-2xl border border-white/10"
                    />
                </motion.div>
            </div>
        </div>
    );
}
