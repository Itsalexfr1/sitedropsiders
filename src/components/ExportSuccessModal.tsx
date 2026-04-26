import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Download, X, Eye } from 'lucide-react';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    readyBlob: Blob | null;
    readyUrl: string;
    filename: string;
    type: 'image' | 'video';
    title?: string;
    subtitle?: string;
}

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
    isOpen,
    onClose,
    readyBlob,
    readyUrl,
    filename,
    type,
    title = "GÉNÉRATION RÉUSSIE !",
    subtitle = "Votre contenu est prêt"
}) => {
    const isMobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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
                    title: 'Dropsiders Export',
                    text: 'Visuel généré via Dropsiders Studio'
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
            alert("Maintenez l'élément qui s'affiche pour l'enregistrer manuellement dans vos photos.");
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

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && readyBlob && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-8 flex flex-col items-center shadow-2xl relative"
                    >
                        {/* Success Icon */}
                        <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center mb-6 border border-neon-green/20">
                            <Check className="w-10 h-10 text-neon-green" />
                        </div>

                        <h2 className="text-2xl font-black text-white italic uppercase mb-2 text-center leading-none tracking-tighter">
                            {title}
                        </h2>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-6 text-center">
                            {subtitle}
                        </p>

                        {/* Preview */}
                        <div className="w-full aspect-[9/16] max-h-[300px] mb-8 rounded-2xl overflow-hidden bg-black border border-white/5 relative group shadow-inner">
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

                        {/* Action Buttons */}
                        <div className="w-full space-y-3">
                            <button
                                onClick={handleSaveOrShare}
                                className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {isMobile ? "📥 Enregistrer / Partager" : "📥 Télécharger le visuel"}
                            </button>

                            <button
                                onClick={handleMirrorDownload}
                                className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-3.5 h-3.5" /> Lien Miroir (Secours)
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full py-4 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-3.5 h-3.5" /> Fermer
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
