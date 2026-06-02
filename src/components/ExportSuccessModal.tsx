import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Download, X, Eye, Instagram } from 'lucide-react';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    readyBlob: Blob | null;
    readyUrl: string;
    filename: string;
    type: 'image' | 'video';
    title?: string;
    subtitle?: string;
    shareUrl?: string;
    shareText?: string;
}

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
    isOpen,
    onClose,
    readyBlob,
    readyUrl,
    filename,
    type,
    title = "GÉNÉRATION RÉUSSIE !",
    subtitle = "Votre contenu est prêt",
    shareUrl,
    shareText
}) => {
    const isMobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInAppBrowser = /Instagram|FBAN|FBAV|Snapchat|TikTok/i.test(navigator.userAgent);
    const [showIosHint, setShowIosHint] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleSaveOrShare = async () => {
        if (!readyBlob) return;

        // For iPhone compatibility, we sometimes want to force the .mov extension if it's a video
        let finalFilename = filename;
        if (type === 'video' && isIOS && !filename.toLowerCase().endsWith('.mov')) {
            const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
            finalFilename = `${base}.mov`;
        }

        const file = new File([readyBlob], finalFilename, { type: readyBlob.type });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: shareText ? 'Dropsiders' : 'Dropsiders Export',
                    text: shareText || 'Visuel généré via Dropsiders Studio',
                    url: shareUrl || undefined
                });
                return;
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.warn("Share failed, falling back to download", err);
                } else {
                    return;
                }
            }
        }

        // Fallback: Direct download
        const a = document.createElement('a');
        a.href = readyUrl;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (isIOS) {
            setShowIosHint(true);
        }
    };

    const handleMirrorDownload = () => {
        const a = document.createElement('a');
        a.href = readyUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const openInstagram = () => {
        if (isIOS) {
            window.location.href = 'instagram://camera';
            setTimeout(() => {
                window.open('https://instagram.com', '_blank');
            }, 1000);
        } else {
            window.location.href = 'intent://story-camera#Intent;package=com.instagram.android;scheme=instagram;end';
            setTimeout(() => {
                window.open('https://instagram.com', '_blank');
            }, 1000);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && readyBlob && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-6 md:p-8 flex flex-col items-center shadow-2xl relative my-8"
                    >
                        {/* Success Icon */}
                        <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mb-4 border border-neon-green/20">
                            <Check className="w-8 h-8 text-neon-green" />
                        </div>

                        <h2 className="text-xl md:text-2xl font-black text-white italic uppercase mb-1 text-center leading-none tracking-tighter">
                            {title}
                        </h2>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 text-center">
                            {subtitle}
                        </p>

                        {/* Preview */}
                        <div className="w-full aspect-[9/16] max-h-[220px] mb-4 rounded-2xl overflow-hidden bg-black border border-white/5 relative group shadow-inner">
                            {type === 'video' ? (
                                <video src={readyUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline controls />
                            ) : (
                                <img src={readyUrl} className="w-full h-full object-cover" alt="Preview" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                            <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                                <Eye className="w-3 h-3 text-white/50" />
                                <span className="text-[8px] font-black text-white/50 uppercase">Aperçu</span>
                            </div>
                        </div>

                        {/* Instructions Section */}
                        {isMobile && (
                            <div className="w-full mb-4 p-4 bg-white/5 border border-white/5 rounded-2xl text-left space-y-2.5">
                                <span className="text-[9px] font-black text-neon-cyan uppercase tracking-widest flex items-center gap-1.5">
                                    💡 PARTAGER SUR INSTAGRAM
                                </span>
                                
                                {isInAppBrowser ? (
                                    <div className="space-y-1.5 text-[9px] text-gray-300 font-bold uppercase tracking-wide leading-relaxed">
                                        <p className="text-neon-red font-black">
                                            ⚠️ NAVIGATEUR INTERNE DÉTECTÉ
                                        </p>
                                        <p className="text-gray-400">
                                            Instagram bloque les téléchargements de fichiers. Pour enregistrer la vidéo :
                                        </p>
                                        <ol className="list-decimal list-inside space-y-1 text-gray-400">
                                            <li>Cliquez sur les <span className="text-white font-black">•••</span> en haut à droite.</li>
                                            <li>Sélectionnez <span className="text-neon-cyan font-black">"Ouvrir dans le navigateur"</span> (Safari/Chrome).</li>
                                            <li>Vous pourrez ensuite l'enregistrer facilement.</li>
                                        </ol>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 text-[9px] text-gray-300 font-bold uppercase tracking-wide leading-relaxed">
                                        <ol className="list-decimal list-inside space-y-1.5 text-gray-400">
                                            {isIOS ? (
                                                <>
                                                    <li>Cliquez sur <span className="text-neon-cyan font-black">"Ouvrir dans un nouvel onglet"</span>.</li>
                                                    <li>Sur le nouvel onglet, cliquez sur le bouton de <span className="text-white font-black">Partage de Safari (flèche ↑ en bas)</span>.</li>
                                                    <li>Sélectionnez <span className="text-white font-black">"Enregistrer la vidéo"</span>.</li>
                                                </>
                                            ) : (
                                                <li>Cliquez sur <span className="text-white font-black">"Télécharger le visuel"</span> pour l'enregistrer dans votre galerie.</li>
                                            )}
                                            <li>Lancez Instagram, créez une Story et importez la vidéo !</li>
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="w-full space-y-2">
                            <button
                                onClick={handleSaveOrShare}
                                className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-[0_10px_25px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {isMobile ? "📥 Enregistrer / Partager" : "📥 Télécharger le visuel"}
                            </button>

                            {shareUrl && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(shareUrl);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        } catch (_) {}
                                    }}
                                    className="w-full py-3 bg-neon-purple/15 border border-neon-purple/30 text-neon-purple font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-neon-purple/25 transition-all flex items-center justify-center gap-2"
                                >
                                    🔗 {copied ? "Lien Copié !" : "Copier le Lien du Mix"}
                                </button>
                            )}

                            {isIOS && type === 'video' && !isInAppBrowser && (
                                <button
                                    onClick={() => window.open(readyUrl, '_blank')}
                                    className="w-full py-3.5 bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-neon-cyan/25 transition-all flex items-center justify-center gap-2"
                                >
                                    👁️ Ouvrir dans un nouvel onglet (iOS)
                                </button>
                            )}

                            {isMobile && !isInAppBrowser && (
                                <button
                                    onClick={openInstagram}
                                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-[0_5px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Instagram className="w-3.5 h-3.5" /> Ouvrir Instagram Stories
                                </button>
                            )}

                            <button
                                onClick={handleMirrorDownload}
                                className="w-full py-3 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-3 h-3" /> Lien Miroir (Secours)
                            </button>

                            {showIosHint && (
                                <div className="w-full px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-widest text-center">
                                    📱 Maintenez la vidéo pour l'enregistrer dans vos photos
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full py-3 text-gray-500 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-3 h-3" /> Fermer
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
