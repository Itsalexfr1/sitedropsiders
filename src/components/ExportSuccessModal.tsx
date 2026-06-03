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
    const isMobile = !!(/iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
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

                            {shareUrl && (
                                <div className="w-full py-2.5 flex flex-col items-center gap-3 border-t border-b border-white/5 my-1">
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.25em]">
                                        Partager le lien sur vos réseaux
                                    </span>
                                    <div className="flex items-center justify-center gap-4">
                                        {/* X (Twitter) */}
                                        <a
                                            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText || 'Écoute mon mix sur Dropsiders ! 🎧🔥')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-white/10 hover:text-neon-cyan transition-all flex items-center justify-center text-white/70"
                                            title="Partager sur X (Twitter)"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                        </a>

                                        {/* Facebook */}
                                        <a
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-white/10 hover:text-neon-cyan transition-all flex items-center justify-center text-white/70"
                                            title="Partager sur Facebook"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                                            </svg>
                                        </a>

                                        {/* WhatsApp */}
                                        <a
                                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent((shareText || 'Écoute mon mix sur Dropsiders ! 🎧🔥') + ' ' + shareUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-white/10 hover:text-neon-cyan transition-all flex items-center justify-center text-white/70"
                                            title="Partager sur WhatsApp"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.963L2 22l5.233-1.371a9.963 9.963 0 0 0 4.775 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.921 9.921 0 0 0 12.012 2zm5.727 14.123c-.253.708-1.47 1.298-2.022 1.353-.5.05-1.15.27-3.48-.69-2.98-1.22-4.9-4.27-5.05-4.47-.15-.2-1.23-1.63-1.23-3.11 0-1.48.77-2.2 1.04-2.5.27-.3.59-.37.79-.37.2 0 .4.01.57.02.18.01.41-.07.65.5.24.58.81 1.98.88 2.13.07.15.12.33.02.52-.1.2-.15.3-.3.48-.15.18-.3.38-.45.53-.15.15-.3.32-.13.62.17.3 1.1 1.8 2.37 2.93 1.63 1.45 3.01 1.9 3.44 2.11.43.2.69.17.95-.12.26-.3 1.13-1.31 1.43-1.76.3-.45.59-.38.99-.23.4.15 2.53 1.19 2.97 1.41.44.22.73.33.84.52.11.19.11 1.09-.14 1.8z"/>
                                            </svg>
                                        </a>

                                        {/* Telegram */}
                                        <a
                                            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText || 'Écoute mon mix sur Dropsiders ! 🎧🔥')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-neon-cyan/50 hover:bg-white/10 hover:text-neon-cyan transition-all flex items-center justify-center text-white/70"
                                            title="Partager sur Telegram"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="margin-right:2px">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.01-.27.01-.12.02-1.96 1.24-5.52 3.65-.52.36-.97.53-1.34.52-.41-.01-1.2-.23-1.79-.42-.72-.24-1.29-.36-1.24-.77.03-.21.32-.43.88-.65 3.43-1.49 5.72-2.48 6.87-2.97 3.28-1.39 3.96-1.63 4.4-.15.1.18.23.53.22.75z"/>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
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
