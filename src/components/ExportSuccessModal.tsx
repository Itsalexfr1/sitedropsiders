import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Download, X, Eye, Instagram, Loader2, Wifi, WifiOff } from 'lucide-react';

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

type StreamStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
    isOpen,
    onClose,
    readyBlob,
    readyUrl,
    filename,
    type,
    title = "GENERATION REUSSIE !",
    subtitle = "Votre contenu est pret",
    shareUrl,
    shareText
}) => {
    const isMobile = !!(/iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInAppBrowser = /Instagram|FBAN|FBAV|Snapchat|TikTok/i.test(navigator.userAgent);
    const [showIosHint, setShowIosHint] = useState(false);
    const [copied, setCopied] = useState(false);

    const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
    const [streamEmbedUrl, setStreamEmbedUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const uploadAttemptedRef = useRef(false);

    useEffect(() => {
        if (!isOpen || type !== 'video' || !readyBlob || uploadAttemptedRef.current) return;
        uploadAttemptedRef.current = true;
        uploadToStream();
    }, [isOpen, type, readyBlob]);

    useEffect(() => {
        if (!isOpen) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setTimeout(() => {
                setStreamStatus('idle');
                setStreamEmbedUrl(null);
                setUploadProgress(0);
                uploadAttemptedRef.current = false;
            }, 300);
        }
    }, [isOpen]);

    const uploadToStream = async () => {
        if (!readyBlob) return;
        setStreamStatus('uploading');
        setUploadProgress(0);
        try {
            // 1. Obtenir une URL d'upload direct Cloudflare Stream
            const createRes = await fetch('/api/stream/create-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename,
                    fileSize: readyBlob.size,
                    maxDuration: 600,
                }),
            });
            if (!createRes.ok) throw new Error(`Create upload status: ${createRes.status}`);
            const data = await createRes.json() as any;
            if (!data.uploadURL || !data.uid) throw new Error('Invalid Stream response');

            // 2. Upload direct vers Cloudflare via FormData (bypass Worker)
            const formData = new FormData();
            formData.append('file', readyBlob, filename);

            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Direct upload failed: ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error during direct upload'));
                xhr.open('POST', data.uploadURL);
                xhr.send(formData);
            });

            setUploadProgress(100);
            setStreamEmbedUrl(data.embedUrl);
            setStreamStatus('processing');
            startPolling(data.uid);
        } catch (e: any) {
            console.warn('Stream direct upload unavailable, using local playback:', e);
            setStreamStatus('error');
        }
    };

    const startPolling = (uid: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        let attempts = 0;
        pollingRef.current = setInterval(async () => {
            attempts++;
            if (attempts > 40) {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setStreamStatus('ready');
                return;
            }
            try {
                const res = await fetch(`/api/stream/status/${uid}`);
                const data = await res.json() as any;
                if (data.readyToStream || data.status === 'ready') {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setStreamStatus('ready');
                }
            } catch { }
        }, 3000);
    };

    const handleSaveOrShare = async () => {
        if (!readyBlob) return;
        let finalFilename = filename;
        if (type === 'video' && isIOS && !filename.toLowerCase().endsWith('.mov')) {
            const base = filename.substring(0, filename.lastIndexOf('.')) || filename;
            finalFilename = `${base}.mov`;
        }
        const file = new File([readyBlob], finalFilename, { type: readyBlob.type });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'Dropsiders Export', text: shareText || 'Dropsiders Studio', url: shareUrl || undefined });
                return;
            } catch (err) {
                if ((err as Error).name === 'AbortError') return;
            }
        }
        const a = document.createElement('a');
        a.href = readyUrl;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (isIOS) setShowIosHint(true);
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
            setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1000);
        } else {
            window.location.href = 'intent://story-camera#Intent;package=com.instagram.android;scheme=instagram;end';
            setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1000);
        }
    };

    if (!isOpen) return null;

    const isVideoReady = type === 'video' && streamStatus === 'ready' && !!streamEmbedUrl;
    const isUploading = streamStatus === 'uploading';

    return createPortal(
        <AnimatePresence>
            {isOpen && readyBlob && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100050] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto">
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-6 md:p-8 flex flex-col items-center shadow-2xl relative my-8">

                        <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mb-4 border border-neon-green/20">
                            <Check className="w-8 h-8 text-neon-green" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white italic uppercase mb-1 text-center leading-none tracking-tighter">{title}</h2>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 text-center">{subtitle}</p>

                        {/* Preview */}
                        <div className="w-full aspect-[9/16] max-h-[280px] mb-4 rounded-2xl overflow-hidden bg-black border border-white/10 relative shadow-inner">

                            {/* Stream ready badge + iframe */}
                            {isVideoReady ? (
                                <>
                                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-neon-green/20 border border-neon-green/30 rounded-lg backdrop-blur-md">
                                        <Wifi className="w-3 h-3 text-neon-green" />
                                        <span className="text-[8px] font-black text-neon-green uppercase">Stream HD</span>
                                    </div>
                                    <iframe
                                        src={`${streamEmbedUrl}?autoplay=true&muted=true&loop=true&controls=false`}
                                        className="absolute inset-0 w-full h-full"
                                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                                        allowFullScreen
                                        style={{ border: 'none' }}
                                    />
                                </>
                            ) : (
                                <>
                                    {/* Local preview (available immediately) */}
                                    {type === 'video' ? (
                                        <video src={readyUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline controls />
                                    ) : (
                                        <img src={readyUrl} className="w-full h-full object-cover" alt="Preview" />
                                    )}

                                    {/* Upload progress chip */}
                                    {isUploading && (
                                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 border border-[#00d4ff]/40 rounded-lg backdrop-blur-md">
                                            <Loader2 className="w-3 h-3 text-[#00d4ff] animate-spin" />
                                            <span className="text-[8px] font-black text-[#00d4ff] uppercase">Sync Cloud {uploadProgress}%</span>
                                        </div>
                                    )}

                                    {/* Processing badge */}
                                    {streamStatus === 'processing' && (
                                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg backdrop-blur-md">
                                            <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                                            <span className="text-[8px] font-black text-amber-400 uppercase">Encodage HD...</span>
                                        </div>
                                    )}

                                    {streamStatus === 'error' && (
                                        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/10 rounded-lg backdrop-blur-md">
                                            <span className="text-[7px] font-black text-gray-400 uppercase">Lecture locale fluide</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        </div>

                        {/* Mobile instructions */}
                        {isMobile && (
                            <div className="w-full mb-4 p-4 bg-white/5 border border-white/5 rounded-2xl text-left space-y-2.5">
                                <span className="text-[9px] font-black text-[#00d4ff] uppercase tracking-widest flex items-center gap-1.5">💡 PARTAGER SUR INSTAGRAM</span>
                                {isInAppBrowser ? (
                                    <div className="space-y-1.5 text-[9px] text-gray-400 font-bold uppercase leading-relaxed">
                                        <p className="text-red-400 font-black">⚠️ NAVIGATEUR INTERNE</p>
                                        <ol className="list-decimal list-inside space-y-1"><li>••• en haut → <span className="text-[#00d4ff]">"Ouvrir dans Safari/Chrome"</span></li></ol>
                                    </div>
                                ) : (
                                    <ol className="list-decimal list-inside space-y-1.5 text-[9px] text-gray-400 font-bold uppercase">
                                        {isIOS ? (<><li>Ouvrir dans un <span className="text-[#00d4ff] font-black">nouvel onglet</span></li><li>Safari partage (↑) → <span className="text-white font-black">Enregistrer la vidéo</span></li></>) : (<li><span className="text-white font-black">Télécharger</span> → galerie</li>)}
                                        <li>Instagram → Story → importer</li>
                                    </ol>
                                )}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="w-full space-y-2">
                            <button onClick={handleSaveOrShare} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-[0_10px_25px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isMobile ? "📥 Enregistrer / Partager" : "📥 Télécharger le visuel"}
                            </button>

                            {shareUrl && (
                                <button onClick={async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (_) { } }} className="w-full py-3 bg-purple-500/15 border border-purple-500/30 text-purple-400 font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-purple-500/25 transition-all flex items-center justify-center gap-2">
                                    🔗 {copied ? "Lien Copié !" : "Copier le Lien du Mix"}
                                </button>
                            )}

                            {shareUrl && (
                                <div className="w-full py-2.5 flex flex-col items-center gap-3 border-t border-b border-white/5 my-1">
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.25em]">Partager sur vos réseaux</span>
                                    <div className="flex items-center justify-center gap-4">
                                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText || 'Écoute mon mix sur Dropsiders ! 🎧🔥')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-[#00d4ff]/50 hover:bg-white/10 hover:text-[#00d4ff] transition-all flex items-center justify-center text-white/70">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        </a>
                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-[#00d4ff]/50 hover:bg-white/10 hover:text-[#00d4ff] transition-all flex items-center justify-center text-white/70">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
                                        </a>
                                        <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent((shareText || 'Écoute mon mix sur Dropsiders ! 🎧🔥') + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-[#00d4ff]/50 hover:bg-white/10 hover:text-[#00d4ff] transition-all flex items-center justify-center text-white/70">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.963L2 22l5.233-1.371a9.963 9.963 0 0 0 4.775 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.037-5.176-2.922-7.062A9.921 9.921 0 0 0 12.012 2zm5.727 14.123c-.253.708-1.47 1.298-2.022 1.353-.5.05-1.15.27-3.48-.69-2.98-1.22-4.9-4.27-5.05-4.47-.15-.2-1.23-1.63-1.23-3.11 0-1.48.77-2.2 1.04-2.5.27-.3.59-.37.79-.37.2 0 .4.01.57.02.18.01.41-.07.65.5.24.58.81 1.98.88 2.13.07.15.12.33.02.52-.1.2-.15.3-.3.48-.15.18-.3.38-.45.53-.15.15-.3.32-.13.62.17.3 1.1 1.8 2.37 2.93 1.63 1.45 3.01 1.9 3.44 2.11.43.2.69.17.95-.12.26-.3 1.13-1.31 1.43-1.76.3-.45.59-.38.99-.23.4.15 2.53 1.19 2.97 1.41.44.22.73.33.84.52.11.19.11 1.09-.14 1.8z"/></svg>
                                        </a>
                                        <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText || 'Dropsiders 🎧🔥')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-[#00d4ff]/50 hover:bg-white/10 hover:text-[#00d4ff] transition-all flex items-center justify-center text-white/70">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.01-.27.01-.12.02-1.96 1.24-5.52 3.65-.52.36-.97.53-1.34.52-.41-.01-1.2-.23-1.79-.42-.72-.24-1.29-.36-1.24-.77.03-.21.32-.43.88-.65 3.43-1.49 5.72-2.48 6.87-2.97 3.28-1.39 3.96-1.63 4.4-.15.1.18.23.53.22.75z"/></svg>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {isIOS && type === 'video' && !isInAppBrowser && (
                                <button onClick={() => window.open(readyUrl, '_blank')} className="w-full py-3.5 bg-[#00d4ff]/15 border border-[#00d4ff]/30 text-[#00d4ff] font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-[#00d4ff]/25 transition-all flex items-center justify-center gap-2">
                                    👁️ Ouvrir dans un nouvel onglet (iOS)
                                </button>
                            )}

                            {isMobile && !isInAppBrowser && (
                                <button onClick={openInstagram} className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] shadow-[0_5px_15px_rgba(236,72,153,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Instagram className="w-3.5 h-3.5" /> Ouvrir Instagram Stories
                                </button>
                            )}

                            <button onClick={handleMirrorDownload} className="w-full py-3 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                <Download className="w-3 h-3" /> Télécharger (local)
                            </button>

                            {showIosHint && (
                                <div className="w-full px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-widest text-center">
                                    📱 Maintenez la vidéo pour l'enregistrer dans vos photos
                                </div>
                            )}

                            <button onClick={onClose} className="w-full py-3 text-gray-500 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2">
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
