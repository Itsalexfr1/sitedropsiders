import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Instagram, Music, Twitter, Youtube, Link, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';

interface DownloaderProps {
    isPopup?: boolean;
}

export const Downloader: React.FC<DownloaderProps> = ({ isPopup = false }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleClear = () => {
        setUrl('');
        setResult(null);
        setError(null);
    };

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Using internal proxy to avoid CORS issues as requested by the site security
            const response = await fetch('/api/downloader-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    videoQuality: '1080',
                    audioFormat: 'mp3',
                    downloadMode: 'auto',
                    filenameStyle: 'pretty',
                    youtubeVideoCodec: 'h264'
                })
            });

            const data = await response.json();

            // Handle Cobalt v10 error formats
            if (data.status === 'error' || data.text?.includes('shut down') || data.message?.includes('shut down')) {
                throw new Error(data.text || data.message || 'Le service de téléchargement est temporairement indisponible.');
            }

            if (data.url || data.picker || Array.isArray(data)) {
                // Determine if it's a direct URL or multiple items (carousels)
                setResult(data);
            } else {
                throw new Error('Aucun lien de téléchargement trouvé pour ce lien.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Impossible de traiter ce lien. Vérifiez l\'URL.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${isPopup ? 'p-6' : 'min-h-screen bg-black pt-32 pb-20 px-4'}`}>
            {!isPopup && (
                <>
                    {/* Background Effects */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-red/10 blur-[150px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-cyan/10 blur-[150px] rounded-full" />
                    </div>
                </>
            )}

            <div className={`max-w-4xl mx-auto relative z-10 ${isPopup ? '' : ''}`}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-center space-y-6 ${isPopup ? 'mb-8' : 'mb-12'}`}
                >
                    <h1 className={`${isPopup ? 'text-4xl' : 'text-5xl md:text-7xl'} font-black italic tracking-tighter text-white`}>
                        SOCIAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-neon-cyan">DOWNLOADER</span>
                    </h1>
                    <p className={`text-gray-400 ${isPopup ? 'text-sm' : 'text-lg'} max-w-2xl mx-auto font-medium`}>
                        Téléchargez vos vidéos et photos Instagram, TikTok, Twitter et plus encore en haute qualité, instantanément.
                    </p>
                </motion.div>

                {/* Main Input Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl shadow-2xl relative overflow-hidden"
                >
                    <form onSubmit={handleDownload} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Link className={`w-5 h-5 transition-colors ${url ? 'text-neon-cyan' : 'text-gray-500'}`} />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Collez le lien Instagram, TikTok, Twitter..."
                                className="w-full bg-black/40 border border-white/10 text-white rounded-3xl py-6 pl-14 pr-48 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all outline-none text-sm md:text-base font-medium placeholder:text-gray-600"
                            />

                            {url && !loading && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-44 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                                    title="Vider le champ"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !url}
                                className="absolute right-3 top-3 bottom-3 px-8 bg-gradient-to-r from-neon-cyan to-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        ANALYSE...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        TÉLÉCHARGER
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Supported Platforms */}
                        <div className="flex flex-wrap justify-center gap-6 pt-4 text-gray-500">
                            {[
                                { icon: Instagram, label: "Instagram" },
                                { icon: Music, label: "TikTok" },
                                { icon: Twitter, label: "Twitter" },
                                { icon: Youtube, label: "Youtube" }
                            ].map((platform, i) => (
                                <div key={i} className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                                    <platform.icon className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{platform.label}</span>
                                </div>
                            ))}
                        </div>
                    </form>
                </motion.div>

                {/* Results Area */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-medium"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-8 bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-6"
                        >
                            <div className="flex items-center gap-3 text-neon-cyan mb-4">
                                <CheckCircle className="w-6 h-6" />
                                <span className="font-black italic uppercase tracking-wider">Média prêt !</span>
                            </div>

                            {result.picker ? (
                                // Multiple items (Instagram carousel or TikTok photos)
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {result.picker.map((item: any, i: number) => (
                                        <div key={i} className="bg-black/40 rounded-3xl overflow-hidden border border-white/10 group">
                                            {item.thumb && (
                                                <img src={item.thumb} alt={`Media ${i}`} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" />
                                            )}
                                            <div className="p-4">
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan hover:text-white transition-all"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    TELECHARGER {i + 1}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Single item
                                <div className="space-y-4">
                                    <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-5 bg-gradient-to-r from-neon-red to-neon-cyan text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(255,18,65,0.4)] transition-all animate-pulse-slow"
                                    >
                                        <Download className="w-5 h-5" />
                                        CLIQUEZ POUR TÉLÉCHARGER LE FICHIER
                                    </a>
                                    <p className="text-center text-gray-500 text-[10px] font-medium">
                                        Note: Si la vidéo s'ouvre dans le navigateur, faites un clic droit (ou appui long) et "Enregistrer sous".
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Features Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    {[
                        { title: "SANS FILIGRANE", desc: "Téléchargez des vidéos TikTok sans le logo officiel." },
                        { title: "HAUTE DÉFINITION", desc: "Accès à la meilleure résolution disponible (1080p, 4K)." },
                        { title: "ACCÈS ILLIMITÉ", desc: "Service 100% gratuit pour toute la communauté Dropsiders." }
                    ].map((feature, i) => (
                        <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
                            <h3 className="text-white font-black italic text-xs uppercase tracking-wider">{feature.title}</h3>
                            <p className="text-gray-500 text-[11px] leading-relaxed font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
