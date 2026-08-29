import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, Music2, Headphones, Disc, Activity, AlertCircle, FileAudio, Info, ListMusic, Plus, Trash2, Edit3, Save, DownloadCloud, Timer, PlayCircle, ClipboardList, Send } from 'lucide-react';

interface Track {
    id: string;
    artist: string;
    title: string;
    timestamp?: string; // Timecode format "MM:SS" or "HH:MM:SS"
}

interface MixUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | null;
    type: 'Track' | 'Remix' | 'Edit' | 'Mix';
    onSuccess: (mixData: any) => void;
}

const categoryStyles = {
    Track: {
        colorName: 'neon-red',
        text: 'text-neon-red',
        bg: 'bg-neon-red',
        bgLight: 'bg-neon-red/10',
        bgBg: 'bg-neon-red/5',
        border: 'border-neon-red',
        borderLight: 'border-neon-red/20',
        borderDashed: 'border-neon-red/30',
        hoverBorder: 'hover:border-neon-red/50',
        hoverBg: 'hover:bg-neon-red/10',
        hoverBgCard: 'hover:bg-neon-red/5',
        cardBorder: 'hover:border-neon-red/30',
        textMuted: 'text-neon-red/50',
        groupHoverText: 'group-hover:text-neon-red',
        selectedText: 'text-white',
        shadow: 'shadow-[0_0_15px_rgba(255,0,0,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(255,0,0,0.5)]',
        // Modal specific additions
        viaColor: 'via-neon-red',
        modalShadow: 'shadow-[0_0_100px_rgba(255,0,0,0.15)]',
        progressShadow: 'shadow-[0_0_15px_rgba(255,0,0,0.8)]',
        focusBorder: 'focus:border-neon-red',
        border50: 'border-neon-red/50',
        toggleBg: 'bg-neon-red shadow-[0_0_10px_rgba(255,0,0,0.5)]',
        toggleShadow: 'shadow-[0_0_20px_rgba(255,0,0,0.1)]',
        toggleBorder: 'border-neon-red/40',
        toggleBgLight: 'bg-neon-red/30',
        importBtn: 'bg-neon-red/10 border-neon-red/30 text-neon-red hover:bg-neon-red/20',
        publishShadow: 'shadow-neon-red/30',
    },
    Remix: {
        colorName: 'neon-purple',
        text: 'text-neon-purple',
        bg: 'bg-neon-purple',
        bgLight: 'bg-neon-purple/10',
        bgBg: 'bg-neon-purple/5',
        border: 'border-neon-purple',
        borderLight: 'border-neon-purple/20',
        borderDashed: 'border-neon-purple/30',
        hoverBorder: 'hover:border-neon-purple/50',
        hoverBg: 'hover:bg-neon-purple/10',
        hoverBgCard: 'hover:bg-neon-purple/5',
        cardBorder: 'hover:border-neon-purple/30',
        textMuted: 'text-neon-purple/50',
        groupHoverText: 'group-hover:text-neon-purple',
        selectedText: 'text-white',
        shadow: 'shadow-[0_0_15px_rgba(188,19,254,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(188,19,254,0.5)]',
        // Modal specific additions
        viaColor: 'via-neon-purple',
        modalShadow: 'shadow-[0_0_100px_rgba(188,19,254,0.15)]',
        progressShadow: 'shadow-[0_0_15px_rgba(188,19,254,0.8)]',
        focusBorder: 'focus:border-neon-purple',
        border50: 'border-neon-purple/50',
        toggleBg: 'bg-neon-purple shadow-[0_0_10px_rgba(188,19,254,0.5)]',
        toggleShadow: 'shadow-[0_0_20px_rgba(188,19,254,0.1)]',
        toggleBorder: 'border-neon-purple/40',
        toggleBgLight: 'bg-neon-purple/30',
        importBtn: 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20',
        publishShadow: 'shadow-neon-purple/30',
    },
    Edit: {
        colorName: 'neon-cyan',
        text: 'text-neon-cyan',
        bg: 'bg-neon-cyan',
        bgLight: 'bg-neon-cyan/10',
        bgBg: 'bg-neon-cyan/5',
        border: 'border-neon-cyan',
        borderLight: 'border-neon-cyan/20',
        borderDashed: 'border-neon-cyan/30',
        hoverBorder: 'hover:border-neon-cyan/50',
        hoverBg: 'hover:bg-neon-cyan/10',
        hoverBgCard: 'hover:bg-neon-cyan/5',
        cardBorder: 'hover:border-neon-cyan/30',
        textMuted: 'text-neon-cyan/50',
        groupHoverText: 'group-hover:text-neon-cyan',
        selectedText: 'text-black',
        shadow: 'shadow-[0_0_15px_rgba(0,240,255,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(0,240,255,0.5)]',
        // Modal specific additions
        viaColor: 'via-neon-cyan',
        modalShadow: 'shadow-[0_0_100px_rgba(0,240,255,0.15)]',
        progressShadow: 'shadow-[0_0_15px_rgba(0,240,255,0.8)]',
        focusBorder: 'focus:border-neon-cyan',
        border50: 'border-neon-cyan/50',
        toggleBg: 'bg-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]',
        toggleShadow: 'shadow-[0_0_20px_rgba(0,240,255,0.1)]',
        toggleBorder: 'border-neon-cyan/40',
        toggleBgLight: 'bg-neon-cyan/30',
        importBtn: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20',
        publishShadow: 'shadow-neon-cyan/30',
    },
    Mix: {
        colorName: 'neon-green',
        text: 'text-neon-green',
        bg: 'bg-neon-green',
        bgLight: 'bg-neon-green/10',
        bgBg: 'bg-neon-green/5',
        border: 'border-neon-green',
        borderLight: 'border-neon-green/20',
        borderDashed: 'border-neon-green/30',
        hoverBorder: 'hover:border-neon-green/50',
        hoverBg: 'hover:bg-neon-green/10',
        hoverBgCard: 'hover:bg-neon-green/5',
        cardBorder: 'hover:border-neon-green/30',
        textMuted: 'text-neon-green/50',
        groupHoverText: 'group-hover:text-neon-green',
        selectedText: 'text-black',
        shadow: 'shadow-[0_0_15px_rgba(57,255,20,0.4)]',
        playIconGlow: 'shadow-[0_0_10px_rgba(57,255,20,0.5)]',
        // Modal specific additions
        viaColor: 'via-neon-green',
        modalShadow: 'shadow-[0_0_100px_rgba(57,255,20,0.15)]',
        progressShadow: 'shadow-[0_0_15px_rgba(57,255,20,0.8)]',
        focusBorder: 'focus:border-neon-green',
        border50: 'border-neon-green/50',
        toggleBg: 'bg-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)]',
        toggleShadow: 'shadow-[0_0_20px_rgba(57,255,20,0.1)]',
        toggleBorder: 'border-neon-green/40',
        toggleBgLight: 'bg-neon-green/30',
        importBtn: 'bg-neon-green/10 border-neon-green/30 text-neon-green hover:bg-neon-green/20',
        publishShadow: 'shadow-neon-green/30',
    }
};

const getCategoryStyle = (type: string) => {
    const normalized = (type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : '') as keyof typeof categoryStyles;
    return categoryStyles[normalized] || categoryStyles.Remix;
};

export function MixUploadModal({ isOpen, onClose, file, type, onSuccess }: MixUploadModalProps) {
    const [step, setStep] = useState<'uploading' | 'metadata' | 'success'>('uploading');
    const [metaTab, setMetaTab] = useState<'info' | 'tracklist'>('info');
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [progress, setProgress] = useState(0);
    const [title, setTitle] = useState(file?.name.replace(/\.[^/.]+$/, "") || '');
    const [genre, setGenre] = useState('');
    const [description, setDescription] = useState('');
    const [allowDownload, setAllowDownload] = useState(false);
    const [calculatedDuration, setCalculatedDuration] = useState('00:00');
    const [tracklist, setTracklist] = useState<Track[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const style = getCategoryStyle(type);

    // Auto-fill title from filename & compute audio duration
    useEffect(() => {
        if (file) {
            setTitle(file.name.replace(/\.[^/.]+$/, "").toUpperCase());
            try {
                const objectUrl = URL.createObjectURL(file);
                const tempAudio = new Audio(objectUrl);
                tempAudio.addEventListener('loadedmetadata', () => {
                    if (isFinite(tempAudio.duration) && tempAudio.duration > 0) {
                        const hrs = Math.floor(tempAudio.duration / 3600);
                        const mins = Math.floor((tempAudio.duration % 3600) / 60);
                        const secs = Math.floor(tempAudio.duration % 60);
                        const formatted = hrs > 0 
                            ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                            : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                        setCalculatedDuration(formatted);
                    }
                    URL.revokeObjectURL(objectUrl);
                });
                tempAudio.addEventListener('error', () => {
                    URL.revokeObjectURL(objectUrl);
                });
            } catch (e) {
                console.warn("Could not calculate audio duration:", e);
            }
        }
    }, [file]);

    // Helper to resolve accurate MIME type
    const getResolvedMime = (targetFile: File) => {
        if (targetFile.type && targetFile.type !== 'application/octet-stream') {
            return targetFile.type;
        }
        const ext = targetFile.name.split('.').pop()?.toLowerCase();
        const map: Record<string, string> = {
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            m4a: 'audio/mp4',
            aac: 'audio/aac',
            flac: 'audio/flac',
            ogg: 'audio/ogg',
            oga: 'audio/ogg',
            weba: 'audio/webm',
            webm: 'audio/webm'
        };
        return (ext && map[ext]) ? map[ext] : (targetFile.type || 'audio/mpeg');
    };

    // Track editing state
    const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
    const [editArtist, setEditArtist] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editTimestamp, setEditTimestamp] = useState('');
    useEffect(() => {
        if (isOpen && step === 'uploading' && file) {
            setProgress(0);
            setError(null);
            
            let active = true;
            let xhr: XMLHttpRequest | null = null;
            let abortMultipart = false;

            const startUpload = async () => {
                const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
                const resolvedMime = getResolvedMime(file);
                const isAudio = resolvedMime.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg|oga|weba|webm)$/i.test(file.name);
                const subFolder = isAudio ? 'SONS' : (resolvedMime.startsWith('video/') ? 'VIDEOS' : 'uploads');

                if (file.size > LARGE_FILE_THRESHOLD) {
                    try {
                        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
                        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                        
                        // 1. Start multipart upload
                        const startRes = await fetch('/api/upload/multipart/start', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Admin-Password': localStorage.getItem('dropsiders_admin_password') || '',
                                'X-Admin-Username': localStorage.getItem('dropsiders_admin_username') || ''
                            },
                            body: JSON.stringify({
                                filename: file.name,
                                type: resolvedMime,
                                path: subFolder
                            })
                        });
                        
                        if (!startRes.ok) {
                            const errData = await startRes.json().catch(() => ({}));
                            throw new Error(errData.error || `Erreur d'initialisation multipart: ${startRes.status}`);
                        }
                        
                        const { uploadId, key } = await startRes.json();
                        const uploadedParts: { partNumber: number; etag: string }[] = [];
                        
                        // 2. Upload chunks sequentially
                        for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
                            if (!active || abortMultipart) return;

                            const startByte = (partNumber - 1) * CHUNK_SIZE;
                            const endByte = Math.min(partNumber * CHUNK_SIZE, file.size);
                            const chunkBlob = file.slice(startByte, endByte);
                            
                            let attempts = 0;
                            const maxAttempts = 3;
                            let partEtag = '';
                            
                            while (attempts < maxAttempts) {
                                if (!active || abortMultipart) return;
                                try {
                                    const partUrl = `/api/upload/multipart/part?uploadId=${encodeURIComponent(uploadId)}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`;
                                    const partRes = await fetch(partUrl, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/octet-stream',
                                            'X-Admin-Password': localStorage.getItem('dropsiders_admin_password') || '',
                                            'X-Admin-Username': localStorage.getItem('dropsiders_admin_username') || ''
                                        },
                                        body: chunkBlob
                                    });
                                    
                                    if (!partRes.ok) {
                                        throw new Error(`Morceau ${partNumber} rejeté: ${partRes.status}`);
                                    }
                                    
                                    const data = await partRes.json();
                                    partEtag = data.etag;
                                    break; // success
                                } catch (err) {
                                    attempts++;
                                    if (attempts >= maxAttempts) {
                                        throw err;
                                    }
                                    await new Promise(r => setTimeout(r, 1000 * attempts));
                                }
                            }
                            
                            uploadedParts.push({ partNumber, etag: partEtag });
                            
                            if (active) {
                                const percent = Math.round((partNumber / totalChunks) * 100);
                                setProgress(percent < 100 ? percent : 99);
                            }
                        }
                        
                        if (!active || abortMultipart) return;

                        // 3. Complete multipart upload
                        const completeRes = await fetch('/api/upload/multipart/complete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Admin-Password': localStorage.getItem('dropsiders_admin_password') || '',
                                'X-Admin-Username': localStorage.getItem('dropsiders_admin_username') || ''
                            },
                            body: JSON.stringify({
                                uploadId,
                                key,
                                parts: uploadedParts
                            })
                        });
                        
                        if (!completeRes.ok) {
                            const errData = await completeRes.json().catch(() => ({}));
                            throw new Error(errData.error || `Erreur de finalisation: ${completeRes.status}`);
                        }
                        
                        const completeData = await completeRes.json();
                        if (completeData.success && completeData.url) {
                            if (active) {
                                setProgress(100);
                                (window as any).uploadedMediaUrl = completeData.url;
                                (window as any).uploadedMediaKey = completeData.key;
                                setTimeout(() => setStep('metadata'), 500);
                            }
                        } else {
                            throw new Error("L'assemblage final du fichier a échoué.");
                        }
                    } catch (err: any) {
                        if (active) {
                            setError(err.message || "Erreur lors de l'upload fragmenté");
                            setStep('metadata');
                        }
                    }
                } else {
                    // Regular upload for smaller files
                    xhr = new XMLHttpRequest();
                    const url = `/api/upload?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(resolvedMime)}&path=${subFolder}`;
                    
                    xhr.open('POST', url, true);
                    
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable && active) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            setProgress(percent < 100 ? percent : 99);
                        }
                    };

                    xhr.onload = () => {
                        if (!active) return;
                        if (xhr!.status >= 200 && xhr!.status < 300) {
                            try {
                                const data = JSON.parse(xhr!.responseText);
                                if (data.success) {
                                    setProgress(100);
                                    (window as any).uploadedMediaUrl = data.url;
                                    (window as any).uploadedMediaKey = data.key;
                                    setTimeout(() => setStep('metadata'), 500);
                                } else {
                                    setError(data.error || "Erreur lors de l'upload");
                                    setStep('metadata');
                                }
                            } catch (err: any) {
                                setError("Erreur lors de l'analyse de la réponse serveur");
                                setStep('metadata');
                            }
                        } else {
                            try {
                                const data = JSON.parse(xhr!.responseText);
                                setError(data.error || `Erreur serveur: ${xhr!.status}`);
                            } catch {
                                setError(`Erreur lors de l'upload (${xhr!.status})`);
                            }
                            setStep('metadata');
                        }
                    };

                    xhr.onerror = () => {
                        if (active) {
                            setError("Erreur réseau ou connexion perdue");
                            setStep('metadata');
                        }
                    };

                    xhr.setRequestHeader('X-Admin-Password', localStorage.getItem('dropsiders_admin_password') || '');
                    xhr.setRequestHeader('X-Admin-Username', localStorage.getItem('dropsiders_admin_username') || '');
                    
                    xhr.send(file);
                }
            };

            startUpload();

            return () => {
                active = false;
                abortMultipart = true;
                if (xhr && xhr.readyState !== XMLHttpRequest.DONE) {
                    xhr.abort();
                }
            };
        }
    }, [isOpen, step, file]);
    if (!isOpen) return null;

    const parseBulkText = (text: string): Track[] => {
        const lines = text.split('\n');
        const tracks: Track[] = [];
        
        // Match formats like: 00:00 - Artist - Title or 00:00 Artist - Title etc.
        // We handle various separators: -, —, –, |
        const regex = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[\—\–\-\|]\s*(.*?)\s*[\—\–\-\|]?\s*(.*)$/i;

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            const match = cleanLine.match(regex);
            if (match) {
                tracks.push({
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: match[1].trim(),
                    artist: match[2].trim() || 'ARTISTE INCONNU',
                    title: match[3].trim() || 'TITRE INCONNU'
                });
            } else if (cleanLine.includes('-') || cleanLine.includes('—') || cleanLine.includes('–')) {
                // Fallback for lines without timestamps
                const parts = cleanLine.split(/[\—\–\-]/);
                if (parts.length >= 2) {
                    tracks.push({
                        id: Math.random().toString(36).substr(2, 9),
                        artist: parts[0].trim().toUpperCase(),
                        title: parts[1].trim(),
                        timestamp: ''
                    });
                }
            }
        });
        return tracks;
    };

    const handleBulkImport = () => {
        const imported = parseBulkText(bulkText);
        if (imported.length > 0) {
            setTracklist(prev => [...prev, ...imported]);
            setShowBulkImport(false);
            setBulkText('');
        }
    };

    const parseSeratoCSV = (text: string): Track[] => {
        const lines = text.split('\n');
        const tracks: Track[] = [];
        let headers: string[] = [];
        let headerIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Name') && lines[i].includes('Artist')) {
                headers = lines[i].split('","').map(h => h.replace(/"/g, '').trim());
                headerIdx = i;
                break;
            }
        }
        const nameIdx = headers.indexOf('Name');
        const artistIdx = headers.indexOf('Artist');
        const timeIdx = headers.indexOf('Start Time');
        lines.slice(headerIdx + 1).forEach(line => {
            const parts = line.split('","').map(p => p.replace(/"/g, '').trim());
            if (parts[nameIdx] && parts[artistIdx]) {
                let timestamp = '';
                if (timeIdx !== -1 && parts[timeIdx]) {
                    timestamp = parts[timeIdx].split(' ')[0];
                }
                tracks.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title: parts[nameIdx],
                    artist: parts[artistIdx],
                    timestamp: timestamp
                });
            }
        });
        return tracks;
    };

    const parseRekordboxTXT = (text: string): Track[] => {
        const lines = text.split('\n');
        const tracks: Track[] = [];
        lines.forEach(line => {
            if (line.includes('\t')) {
                const parts = line.split('\t');
                if (parts.length >= 2 && parts[0] !== 'Artist' && parts[0] !== '#') {
                    tracks.push({
                        id: Math.random().toString(36).substr(2, 9),
                        artist: parts[0],
                        title: parts[1],
                        timestamp: ''
                    });
                }
            } else if (line.includes(' - ')) {
                const [artist, title] = line.split(' - ');
                if (artist && title) {
                    tracks.push({
                        id: Math.random().toString(36).substr(2, 9),
                        artist: artist.trim(),
                        title: title.trim(),
                        timestamp: ''
                    });
                }
            }
        });
        return tracks;
    };

    const handleImportTracklist = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            let imported: Track[] = [];
            if (file.name.endsWith('.csv')) {
                imported = parseSeratoCSV(text);
            } else {
                imported = parseRekordboxTXT(text);
            }
            if (imported.length > 0) {
                setTracklist(prev => [...prev, ...imported]);
                setMetaTab('tracklist');
            }
        };
        reader.readAsText(file);
    };

    const addTrack = () => {
        const newTrack: Track = {
            id: Math.random().toString(36).substr(2, 9),
            artist: 'NOUVEL ARTISTE',
            title: 'NOUVEAU TITRE',
            timestamp: '00:00'
        };
        setTracklist(prev => [...prev, newTrack]);
        setEditingTrackId(newTrack.id);
        setEditArtist(newTrack.artist);
        setEditTitle(newTrack.title);
        setEditTimestamp(newTrack.timestamp || '');
    };

    const saveTrack = (id: string) => {
        setTracklist(prev => prev.map(t => t.id === id ? { ...t, artist: editArtist, title: editTitle, timestamp: editTimestamp } : t));
        setEditingTrackId(null);
    };

    const deleteTrack = (id: string) => {
        setTracklist(prev => prev.filter(t => t.id !== id));
    };

    const handleFinalize = async () => {
        if (!title.trim()) {
            setError("Le titre est obligatoire");
            return;
        }
        
        const mixData = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            genre,
            description,
            allowDownload,
            type,
            tracklist,
            audioUrl: (window as any).uploadedMediaUrl,
            audioKey: (window as any).uploadedMediaKey,
            uploadDate: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            duration: calculatedDuration || '00:00'
        };

        try {
            const user = JSON.parse(localStorage.getItem('dropsiders_user') || '{}');
            if (!user.email) throw new Error("Utilisateur non connecté");

            const res = await fetch(`/api/user/mixes?email=${encodeURIComponent(user.email)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': localStorage.getItem('dropsiders_admin_password') || '',
                    'X-Admin-Username': localStorage.getItem('dropsiders_admin_username') || ''
                },
                body: JSON.stringify(mixData)
            });

            if (res.ok) {
                setStep('success');
                onSuccess(mixData);
            } else {
                const err = await res.json();
                setError(err.error || "Erreur lors de la sauvegarde");
            }
        } catch (e: any) {
            setError(e.message || "Erreur de connexion");
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] overflow-hidden ${style.modalShadow} max-h-[90vh] flex flex-col`}
                >
                    {/* Header Bloom */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${style.viaColor} to-transparent opacity-50`} />
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1">
                        {step === 'uploading' && (
                            <div className="text-center space-y-8 py-10">
                                <div className="relative inline-block">
                                    <div className={`w-24 h-24 ${style.bgLight} rounded-[32px] flex items-center justify-center relative z-10 animate-pulse`}>
                                        <Upload className={`w-10 h-10 ${style.text} animate-bounce`} />
                                    </div>
                                    <div className={`absolute inset-0 ${style.bgLight} blur-2xl rounded-full`} />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Upload en cours</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{file?.name}</p>
                                </div>

                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                                        <motion.div 
                                            className={`h-full ${style.bg} ${style.progressShadow}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className={style.text}>{Math.round(progress)}%</span>
                                        <span className="text-gray-600">Sync R2 Cloud...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'metadata' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 ${style.bgLight} rounded-2xl flex items-center justify-center shrink-0`}>
                                            <FileAudio className={`w-6 h-6 ${style.text}`} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-display font-black text-white italic uppercase tracking-widest leading-none">Studio Finalisation</h2>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{type}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
                                        <button 
                                            onClick={() => setMetaTab('info')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${metaTab === 'info' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            <Info className="w-3 h-3" /> Info
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setMetaTab('tracklist');
                                                setShowBulkImport(false);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${metaTab === 'tracklist' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            <ListMusic className="w-3 h-3" /> Tracklist {tracklist.length > 0 && `(${tracklist.length})`}
                                        </button>
                                    </div>
                                </div>

                                {metaTab === 'info' ? (
                                    <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Titre de l'œuvre</label>
                                            <input 
                                                type="text" 
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value.toUpperCase())}
                                                placeholder="TITRE DU MIX / TRACK..."
                                                className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold uppercase tracking-widest focus:outline-none ${style.focusBorder} transition-all italic text-sm`}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Genre</label>
                                                <input 
                                                    type="text" 
                                                    value={genre}
                                                    onChange={(e) => setGenre(e.target.value.toUpperCase())}
                                                    placeholder="TECHNO, HOUSE..."
                                                    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold uppercase tracking-widest focus:outline-none ${style.focusBorder} transition-all italic text-xs`}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Import Historique (Serato/Rekordbox)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef}
                                                        onChange={handleImportTracklist}
                                                        accept=".csv,.txt"
                                                        className="hidden"
                                                    />
                                                    <button 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className={`w-full ${style.importBtn} rounded-2xl px-6 py-4 font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2`}
                                                    >
                                                        <DownloadCloud className="w-4 h-4" /> Importer Fichier
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Description (Optionnel)</label>
                                            <textarea 
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={4}
                                                placeholder="Partage l'histoire de ce mix..."
                                                className={`w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white font-medium text-sm focus:outline-none ${style.focusBorder} transition-all resize-none`}
                                            />
                                        </div>

                                        {/* Allow Download Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setAllowDownload(v => !v)}
                                            className={`w-full flex items-center justify-between gap-4 p-5 rounded-2xl border transition-all group ${
                                                allowDownload
                                                    ? `${style.bgLight} ${style.toggleBorder} ${style.toggleShadow}`
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                                    allowDownload ? `${style.toggleBgLight} ${style.text}` : 'bg-white/5 text-gray-600'
                                                }`}>
                                                    <DownloadCloud className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${
                                                        allowDownload ? style.text : 'text-gray-400 group-hover:text-white'
                                                    }`}>Autoriser le téléchargement</p>
                                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
                                                        {allowDownload ? 'Les visiteurs peuvent télécharger ce fichier' : 'Écoute uniquement — pas de téléchargement'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-all duration-300 shrink-0 ${
                                                allowDownload ? style.toggleBg : 'bg-white/10'
                                            }`}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                                                    allowDownload ? 'left-7' : 'left-1'
                                                }`} />
                                            </div>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Liste des Morceaux</h3>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setShowBulkImport(!showBulkImport)}
                                                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showBulkImport ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                                                >
                                                    <ClipboardList className="w-3 h-3" /> {showBulkImport ? 'Masquer Import' : 'Import en Masse'}
                                                </button>
                                                <button 
                                                    onClick={addTrack}
                                                    className={`flex items-center gap-2 px-4 py-2 ${style.bgLight} ${style.text} rounded-xl text-[9px] font-black uppercase tracking-widest hover:${style.hoverBg} transition-all border ${style.borderLight}`}
                                                >
                                                    <Plus className="w-3 h-3" /> Ajouter manual
                                                </button>
                                            </div>
                                        </div>

                                        {showBulkImport ? (
                                            <div className="space-y-4 animate-in zoom-in-95 duration-200">
                                                <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Colle ta tracklist ici (Format: 00:00 - Artiste - Titre)</label>
                                                        <div className={`px-2 py-1 ${style.bgLight} ${style.text} text-[7px] font-black rounded uppercase`}>Détection Auto Active</div>
                                                    </div>
                                                    <textarea 
                                                        value={bulkText}
                                                        onChange={(e) => setBulkText(e.target.value)}
                                                        rows={8}
                                                        placeholder="00:00 — Intro – You & Me Innerbloom&#10;05:00 — ARKAD3 – Finder House"
                                                        className={`w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-gray-700 focus:outline-none ${style.focusBorder} transition-all resize-none font-mono`}
                                                    />
                                                    <button 
                                                        onClick={handleBulkImport}
                                                        disabled={!bulkText.trim()}
                                                        className={`w-full py-4 ${style.bg} ${style.selectedText} rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg ${style.publishShadow} hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale`}
                                                    >
                                                        Lancer l'importation de {bulkText.split('\n').filter(l => l.trim()).length} lignes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {tracklist.length > 0 ? (
                                                    tracklist.map((track, idx) => (
                                                        <div key={track.id} className={`group p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all relative overflow-hidden`}>
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className={`w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-600 border border-white/5 group-hover:${style.text} group-hover:border-${style.colorName}/30 transition-colors shrink-0`}>
                                                                    {idx + 1}
                                                                </div>
                                                                {editingTrackId === track.id ? (
                                                                    <div className="flex-1 flex gap-3">
                                                                        <div className="flex-[2] space-y-1">
                                                                            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Artiste</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editArtist}
                                                                                onChange={(e) => setEditArtist(e.target.value.toUpperCase())}
                                                                                className={`w-full bg-black/40 border ${style.border50} rounded-lg px-3 py-2 text-[11px] text-white font-bold uppercase tracking-widest outline-none`}
                                                                            />
                                                                        </div>
                                                                        <div className="flex-[2] space-y-1">
                                                                            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Titre</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editTitle}
                                                                                onChange={(e) => setEditTitle(e.target.value.toUpperCase())}
                                                                                className={`w-full bg-black/40 border ${style.border50} rounded-lg px-3 py-2 text-[11px] text-white font-bold uppercase tracking-widest outline-none`}
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 space-y-1">
                                                                            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest ml-1">Time</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editTimestamp}
                                                                                placeholder="00:00"
                                                                                onChange={(e) => setEditTimestamp(e.target.value)}
                                                                                className={`w-full bg-black/40 border ${style.border50} rounded-lg px-3 py-2 text-[11px] ${style.text} font-black uppercase tracking-widest outline-none text-center`}
                                                                            />
                                                                        </div>
                                                                        <button onClick={() => saveTrack(track.id)} className="mt-6 p-2 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-colors h-10 w-10 flex items-center justify-center shrink-0 border border-neon-green/20">
                                                                            <Save className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex-1 flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">{track.artist}</h4>
                                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{track.title}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 pr-4">
                                                                            <div className={`flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-lg group-hover:border-${style.colorName}/30 transition-all group-hover:${style.bgBg}`}>
                                                                                <Timer className={`w-3 h-3 text-gray-600 group-hover:${style.text}`} />
                                                                                <span className={`text-[10px] font-black text-gray-500 group-hover:${style.text}`}>{track.timestamp || '--:--'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {editingTrackId !== track.id && (
                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button 
                                                                        onClick={() => {
                                                                            setEditingTrackId(track.id);
                                                                            setEditArtist(track.artist);
                                                                            setEditTitle(track.title);
                                                                            setEditTimestamp(track.timestamp || '');
                                                                        }}
                                                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => deleteTrack(track.id)}
                                                                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.02]">
                                                        <ListMusic className="w-12 h-12 mx-auto mb-4 text-gray-800" />
                                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Tracklist vide</p>
                                                        <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-1">Colle du texte ou importe des fichiers .CSV/.TXT</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    <button 
                                        onClick={() => metaTab === 'tracklist' ? setMetaTab('info') : onClose()}
                                        className="flex-1 py-4 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                                    >
                                        {metaTab === 'tracklist' ? 'Retour' : 'Annuler'}
                                    </button>
                                    <button 
                                        onClick={handleFinalize}
                                        className={`flex-[2] py-4 ${style.bg} ${style.selectedText} rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg ${style.publishShadow} hover:scale-[1.02] active:scale-95 transition-all`}
                                    >
                                        Publier sur Dropsiders
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-8 py-10">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 bg-neon-green/20 rounded-[32px] flex items-center justify-center relative z-10">
                                        <CheckCircle2 className="w-12 h-12 text-neon-green" />
                                    </div>
                                    <div className="absolute inset-0 bg-neon-green/20 blur-2xl rounded-full" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter">Publication Réussie</h2>
                                    <div className="max-w-xs mx-auto">
                                        <p className="text-[12px] text-gray-400 font-medium leading-relaxed italic border-l-2 border-neon-green/30 pl-4 py-1">
                                            "{title}" {tracklist.length > 0 && `avec ${tracklist.length} morceaux`} est désormais en ligne.
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-6">
                                    <button 
                                        onClick={onClose}
                                        className="px-12 py-4 bg-neon-green text-black rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-neon-green/20 hover:scale-105 transition-all"
                                    >
                                        Voir mon profil
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
