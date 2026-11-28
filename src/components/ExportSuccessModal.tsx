import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Download, X, Instagram, Loader2, Wifi, Mail, Link2, FileArchive } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    readyBlob: Blob | null;
    readyUrl: string;
    filename: string;
    type: 'image' | 'video' | 'zip';
    title?: string;
    subtitle?: string;
    shareUrl?: string;
    shareText?: string;
    enableEmailExport?: boolean;
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
    shareText,
    enableEmailExport = false
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

    // Social Studio 24h temporary export & email state
    const [emailRecipients, setEmailRecipients] = useState('');
    const [emailNote, setEmailNote] = useState('');
    const [tempExportState, setTempExportState] = useState<'idle' | 'uploading' | 'ready' | 'sending' | 'sent' | 'error'>('idle');
    const [tempUploadProgress, setTempUploadProgress] = useState(0);
    const [tempExportResult, setTempExportResult] = useState<{ token: string; downloadUrl: string; expiresAt: number } | null>(null);
    const [tempExportError, setTempExportError] = useState<string | null>(null);
    const [copiedTempLink, setCopiedTempLink] = useState(false);

    useEffect(() => {
        if (!isOpen || !enableEmailExport) return;
        let cancelled = false;
        const adminUser = localStorage.getItem('admin_user') || '';
        if (adminUser.includes('@')) {
            setEmailRecipients(prev => prev || adminUser);
        }
        fetch('/api/social-studio/editor-info', { headers: getAuthHeaders(null) })
            .then(res => res.ok ? res.json() : null)
            .then((data: any) => {
                if (!cancelled && data?.email) {
                    setEmailRecipients(prev => prev || data.email);
                }
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, [isOpen, enableEmailExport]);

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
                setTempExportState('idle');
                setTempUploadProgress(0);
                setTempExportResult(null);
                setTempExportError(null);
                setCopiedTempLink(false);
                setEmailNote('');
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

    const ensureTempUpload = async (): Promise<{ token: string; downloadUrl: string; expiresAt: number }> => {
        if (tempExportResult) return tempExportResult;
        if (!readyBlob) throw new Error('Aucun fichier prêt à envoyer');

        setTempExportState('uploading');
        setTempUploadProgress(0);
        setTempExportError(null);

        const contentType = readyBlob.type || 'application/octet-stream';
        const SINGLE_UPLOAD_LIMIT = 50 * 1024 * 1024; // 50 Mo

        let result: { token: string; downloadUrl: string; expiresAt: number };

        if (readyBlob.size < SINGLE_UPLOAD_LIMIT) {
            const params = new URLSearchParams({
                filename,
                contentType,
                size: String(readyBlob.size),
            });
            result = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setTempUploadProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };
                xhr.onload = () => {
                    try {
                        const data = JSON.parse(xhr.responseText || '{}');
                        if (xhr.status >= 200 && xhr.status < 300 && data.token && data.downloadUrl) {
                            resolve({ token: data.token, downloadUrl: data.downloadUrl, expiresAt: data.expiresAt });
                        } else {
                            reject(new Error(data.error || `Erreur upload (${xhr.status})`));
                        }
                    } catch {
                        reject(new Error(`Erreur upload (${xhr.status})`));
                    }
                };
                xhr.onerror = () => reject(new Error('Erreur réseau pendant l’upload'));
                xhr.open('PUT', `/api/social-studio/export-upload?${params.toString()}`);
                const authHeaders = getAuthHeaders(contentType);
                Object.entries(authHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
                xhr.send(readyBlob);
            });
        } else {
            // Chunked R2 multipart upload (20 Mo par chunk, supporte toute taille)
            const CHUNK_SIZE = 20 * 1024 * 1024;
            const createRes = await fetch('/api/social-studio/export-multipart/create', {
                method: 'POST',
                headers: getAuthHeaders('application/json'),
                body: JSON.stringify({ filename, contentType }),
            });
            const createData = await createRes.json() as any;
            if (!createRes.ok || !createData.uploadId || !createData.key || !createData.token) {
                throw new Error(createData?.error || 'Impossible d’initialiser l’upload');
            }

            const totalParts = Math.ceil(readyBlob.size / CHUNK_SIZE);
            const parts: Array<{ partNumber: number; etag: string }> = [];
            let uploadedBytes = 0;

            for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
                const start = (partNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, readyBlob.size);
                const chunk = readyBlob.slice(start, end);
                const partParams = new URLSearchParams({
                    key: createData.key,
                    uploadId: createData.uploadId,
                    partNumber: String(partNumber),
                });

                const partData = await new Promise<{ partNumber: number; etag: string }>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            setTempUploadProgress(Math.min(99, Math.round(((uploadedBytes + e.loaded) / readyBlob.size) * 100)));
                        }
                    };
                    xhr.onload = () => {
                        try {
                            const json = JSON.parse(xhr.responseText || '{}');
                            if (xhr.status >= 200 && xhr.status < 300 && json.etag) {
                                resolve(json);
                            } else {
                                reject(new Error(json.error || `Erreur chunk ${partNumber}`));
                            }
                        } catch {
                            reject(new Error(`Erreur chunk ${partNumber}`));
                        }
                    };
                    xhr.onerror = () => reject(new Error(`Erreur réseau chunk ${partNumber}`));
                    xhr.open('PUT', `/api/social-studio/export-multipart/part?${partParams.toString()}`);
                    const authHeaders = getAuthHeaders('application/octet-stream');
                    Object.entries(authHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
                    xhr.send(chunk);
                });

                uploadedBytes += chunk.size;
                parts.push(partData);
            }

            const completeRes = await fetch('/api/social-studio/export-multipart/complete', {
                method: 'POST',
                headers: getAuthHeaders('application/json'),
                body: JSON.stringify({
                    token: createData.token,
                    key: createData.key,
                    uploadId: createData.uploadId,
                    parts,
                    filename: createData.filename || filename,
                    contentType,
                    size: readyBlob.size,
                }),
            });
            const completeData = await completeRes.json() as any;
            if (!completeRes.ok || !completeData.downloadUrl) {
                throw new Error(completeData?.error || 'Finalisation upload échouée');
            }
            result = { token: completeData.token, downloadUrl: completeData.downloadUrl, expiresAt: completeData.expiresAt };
        }

        setTempUploadProgress(100);
        setTempExportResult(result);
        setTempExportState('ready');
        return result;
    };

    const handleSendExportEmail = async () => {
        try {
            if (!emailRecipients.trim()) {
                setTempExportError('Veuillez saisir au moins une adresse e-mail.');
                setTempExportState('error');
                return;
            }
            const uploaded = await ensureTempUpload();
            setTempExportState('sending');
            setTempExportError(null);

            const res = await fetch('/api/social-studio/export-send-email', {
                method: 'POST',
                headers: getAuthHeaders('application/json'),
                body: JSON.stringify({
                    token: uploaded.token,
                    recipients: emailRecipients,
                    note: emailNote.trim() || undefined,
                }),
            });
            const data = await res.json() as any;
            if (!res.ok) {
                throw new Error(data?.error || `Erreur d'envoi (${res.status})`);
            }
            setTempExportState('sent');
        } catch (err: any) {
            setTempExportError(err?.message || "Impossible d'envoyer l'e-mail");
            setTempExportState('error');
        }
    };

    const handleCopyTempLink = async () => {
        try {
            const uploaded = await ensureTempUpload();
            await navigator.clipboard.writeText(uploaded.downloadUrl);
            setCopiedTempLink(true);
            setTimeout(() => setCopiedTempLink(false), 2500);
        } catch (err: any) {
            setTempExportError(err?.message || 'Impossible de générer le lien');
            setTempExportState('error');
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
                        <div className={`w-full ${type === 'zip' ? 'py-6 px-4' : 'aspect-[9/16] max-h-[280px]'} mb-4 rounded-2xl overflow-hidden bg-black border border-white/10 relative shadow-inner flex items-center justify-center`}>

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
                            ) : type === 'zip' ? (
                                <div className="flex flex-col items-center text-center gap-2 z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center">
                                        <FileArchive className="w-6 h-6 text-[#00d4ff]" />
                                    </div>
                                    <p className="text-[11px] font-black text-white break-all px-2">{filename}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        Archive ZIP · {readyBlob.size >= 1024 * 1024 ? `${(readyBlob.size / (1024 * 1024)).toFixed(1)} Mo` : `${Math.max(1, Math.round(readyBlob.size / 1024))} Ko`}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Local preview (available immediately) */}
                                    {type === 'video' ? (
                                        <video src={readyUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline controls />
                                    ) : (
                                        <img src={readyUrl} className="w-full h-full object-contain" alt="Preview" />
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

                            {enableEmailExport && (
                                <div className="w-full mt-2 p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-[#00d4ff] uppercase tracking-widest flex items-center gap-1.5">
                                            <Mail className="w-3 h-3" /> Envoyer un lien direct (24h)
                                        </span>
                                        <span className="text-[8px] font-bold text-gray-500 uppercase">Suppression auto 24h</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={emailRecipients}
                                        onChange={(e) => setEmailRecipients(e.target.value)}
                                        placeholder="Email(s) séparés par virgule..."
                                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00d4ff]/50"
                                    />
                                    <input
                                        type="text"
                                        value={emailNote}
                                        onChange={(e) => setEmailNote(e.target.value)}
                                        placeholder="Note optionnelle (ex: Story prête pour ce soir)"
                                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20"
                                    />
                                    {tempExportState === 'uploading' && (
                                        <div className="w-full space-y-1">
                                            <div className="flex justify-between text-[8px] font-black text-[#00d4ff] uppercase">
                                                <span>Envoi sécurisé vers le cloud...</span>
                                                <span>{tempUploadProgress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#00d4ff] transition-all duration-200" style={{ width: `${tempUploadProgress}%` }} />
                                            </div>
                                        </div>
                                    )}
                                    {tempExportState === 'sent' && (
                                        <div className="px-3 py-2 bg-neon-green/10 border border-neon-green/30 rounded-xl text-[9px] font-black text-neon-green uppercase text-center">
                                            ✅ E-mail envoyé ! Lien valide 24h.
                                        </div>
                                    )}
                                    {tempExportState === 'error' && tempExportError && (
                                        <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-[9px] font-bold text-red-400 text-center">
                                            {tempExportError}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            disabled={tempExportState === 'uploading' || tempExportState === 'sending'}
                                            onClick={handleSendExportEmail}
                                            className="w-full py-3.5 px-4 bg-[#ff1241] hover:bg-[#ff1241]/90 disabled:opacity-50 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-[0_8px_24px_rgba(255,18,65,0.28)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            {(tempExportState === 'uploading' || tempExportState === 'sending') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                            {tempExportState === 'sending' ? 'Envoi en cours...' : 'Envoyer le lien par mail'}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={tempExportState === 'uploading' || tempExportState === 'sending'}
                                            onClick={handleCopyTempLink}
                                            className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-gray-300 font-bold rounded-xl uppercase tracking-wider text-[8px] transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Link2 className="w-3 h-3 text-[#00d4ff]" />
                                            {copiedTempLink ? 'Lien 24h copié !' : 'Copier le lien 24h'}
                                        </button>
                                    </div>
                                </div>
                            )}

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
