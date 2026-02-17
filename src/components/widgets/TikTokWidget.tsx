import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Play } from 'lucide-react';
import { TikTokEmbed } from 'react-social-media-embed';
import { useHoverSound } from '../../hooks/useHoverSound';

export function TikTokWidget() {
    const playHoverSound = useHoverSound();
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    // ------------------------------------------------------------------
    // CONFIGURATION : REMPLACEZ LES LIENS CI-DESSOUS PAR VOS PROPRES VIDÉOS
    // ------------------------------------------------------------------
    const videos = [
        {
            id: '1',
            // Mettez ici le lien de votre vidéo TikTok
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            // Image locale téléchargée
            thumbnail: '/images/widgets/tiktok_1.jpg'
        },
        {
            id: '2',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_2.jpg'
        },
        {
            id: '3',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_3.jpg'
        },
        {
            id: '4',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_4.jpg'
        },
        {
            id: '5',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_5.jpg'
        },
        {
            id: '6',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_6.jpg'
        },
        {
            id: '7',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_7.jpg'
        },
        {
            id: '8',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_8.jpg'
        },
        {
            id: '9',
            url: 'https://www.tiktok.com/@dropsiders.eu/video/7335688536836771105',
            thumbnail: '/images/widgets/tiktok_9.jpg'
        }
    ];
    // ------------------------------------------------------------------

    return (
        <>
            {/* Lightbox */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedVideo(null)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <motion.button
                            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[101]"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <X className="w-10 h-10" />
                        </motion.button>

                        <div
                            className="h-[85vh] w-full max-w-[400px] flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TikTokEmbed
                                url={selectedVideo}
                                width="100%"
                                style={{ height: '100%', borderRadius: '12px' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            onMouseEnter={(e) => {
                                e.stopPropagation();
                                playHoverSound();
                            }}
                            onClick={() => setSelectedVideo(video.url)}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden group border border-white/5 cursor-pointer"
                        >
                            <img
                                src={video.thumbnail}
                                alt="TikTok thumbnail"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <Play className="w-8 h-8 fill-neon-cyan text-neon-cyan" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </>
    );
}
