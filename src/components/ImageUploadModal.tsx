import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Film, Crop, Zap, Trash2, Layers, HardDrive, ArrowUpDown, Check } from 'lucide-react';
import { ImageCropper } from './ImageCropper';
import { getAuthHeaders } from '../utils/auth';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: (urls: string | string[]) => void;
    onClear?: () => void;
    accentColor?: string; // e.g. 'neon-red', 'neon-red', etc. (Tailwind class part)
    aspect?: number;
    initialImage?: string;
    allowMultiple?: boolean;
    watermark?: boolean;   // Automatically add DROPSIDERS logo
    forceFilename?: string; // Force upload filename
}

export function ImageUploadModal({ 
    isOpen, 
    onClose, 
    onUploadSuccess, 
    onClear, 
    accentColor = 'neon-red', 
    aspect, 
    initialImage,
    allowMultiple = false,
    watermark = false,
    forceFilename
}: ImageUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Mapping accentColor to actual Tailwind classes
    let bgClass = "bg-neon-red/20";
    let textClass = "text-neon-red";

    if (accentColor === 'neon-red') {
        bgClass = "bg-neon-red/20";
        textClass = "text-neon-red";
    } else if (accentColor === 'neon-blue') {
        bgClass = "bg-neon-blue/20";
        textClass = "text-neon-blue";
    } else if (accentColor === 'neon-cyan') {
        bgClass = "bg-neon-cyan/20";
        textClass = "text-neon-cyan";
    }

    const [selectedImages, setSelectedImages] = useState<{file: File | null, preview: string}[]>([]);
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [step, setStep] = useState<'idle' | 'preview' | 'gallery'>(initialImage ? 'preview' : 'idle');
    const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(watermark);

    // R2 State
    const [r2Photos, setR2Photos] = useState<any[]>([]);
    const [r2Loading, setR2Loading] = useState(false);
    const [r2Cursor, setR2Cursor] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!r2Cursor || r2Loading) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                handleR2LoadMore();
            }
        }, { threshold: 0.1 });

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [r2Cursor, r2Loading]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchR2Photos();
            if (initialImage) {
                setSelectedImages([{ file: null, preview: initialImage }]);
                setStep('preview');
            }
        } else if (!isOpen) {
            document.body.style.overflow = 'unset';
            setSelectedImages([]);
            setStep('idle');
            setStatus('idle');
            setUploadProgress(0);
            setR2Photos([]);
            setR2Cursor(null);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, initialImage]);

    const fetchR2Photos = async (targetCursor?: string | null) => {
        setR2Loading(true);
        try {
            if (sortBy === 'unused' as any) {
                const res = await fetch('/api/admin/unused-r2-images', { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setR2Photos((data.unused || []).map((p: any) => ({ ...p, url: `/${p.key}` })));
                    setR2Cursor(null);
                }
                return;
            }

            const sortParam = sortBy === 'newest' ? '&sort=date' : '';
            const url = `/api/r2/list?limit=100${targetCursor ? `&cursor=${encodeURIComponent(targetCursor)}` : ''}${sortParam}`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                    const processed = (data.objects || []).map((p: any) => ({ ...p, url: p.key.startsWith('http') ? p.key : `/${p.key}` }));
                    if (targetCursor) {
                        setR2Photos(prev => [...prev, ...processed]);
                    } else {
                        setR2Photos(processed);
                    }
                setR2Cursor(data.cursor || null);
            }
        } catch (err) {
            console.error('Failed to fetch R2 photos', err);
        } finally {
            setR2Loading(false);
        }
    };

    useEffect(() => {
        if (sortBy === 'unused' as any) {
            fetchR2Photos();
        } else if (isOpen) {
            fetchR2Photos();
        }
    }, [sortBy]);

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

    const sanitizeFilename = (name: string) => {
        const parts = name.split('.');
        const ext = parts.pop();
        const base = parts.join('.');
        return base.replace(/[^a-z0-9]/gi, '_').toLowerCase() + (ext ? `.${ext.toLowerCase()}` : '');
    };

    const handleR2LoadMore = () => {
        if (r2Cursor && !r2Loading) {
            fetchR2Photos(r2Cursor);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages: {file: File, preview: string}[] = [];
        let processedCount = 0;
        let errors: string[] = [];

        files.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

            if (!isImage && !isVideo) {
                errors.push(`${file.name}: Type non supporté.`);
                processedCount++;
                if (processedCount === files.length) {
                    finalizeFileChange(newImages, errors);
                }
                return;
            }

            if (file.size > maxSize) {
                errors.push(`${file.name}: Trop volumineux (Max ${isImage ? '10' : '50'}MB).`);
                processedCount++;
                if (processedCount === files.length) {
                    finalizeFileChange(newImages, errors);
                }
                return;
            }

            if (isImage) {
                const reader = new FileReader();
                reader.onload = () => {
                    newImages.push({ file, preview: reader.result as string });
                    processedCount++;
                    if (processedCount === files.length) {
                        finalizeFileChange(newImages, errors);
                    }
                };
                reader.readAsDataURL(file);
            } else if (isVideo) {
                newImages.push({ file, preview: URL.createObjectURL(file) });
                processedCount++;
                if (processedCount === files.length) {
                    finalizeFileChange(newImages, errors);
                }
            }
        });
    };

    const finalizeFileChange = (images: {file: File | null, preview: string}[], errors: string[]) => {
        if (errors.length > 0) {
            setStatus('error');
            setMessage(errors.join(' '));
        }
        if (images.length > 0) {
            setSelectedImages(images);
            setStep('preview');
        }
    };

    const processImage = async (dataUrl: string): Promise<string> => {
        if (!isWatermarkEnabled) return dataUrl;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Canvas context error');

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Add DROPSIDERS Logo
                const logo = new Image();
                logo.crossOrigin = "anonymous";
                logo.src = '/Logo.png';
                logo.onload = () => {
                    const margin = canvas.width * 0.03;
                    const logoWidth = canvas.width * 0.2; // 20% of image width
                    const logoHeight = (logo.height / logo.width) * logoWidth;

                    ctx.globalAlpha = 0.4; // 40% opacity
                    ctx.drawImage(logo, margin, margin, logoWidth, logoHeight);
                    ctx.globalAlpha = 1.0;

                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                logo.onerror = () => {
                    console.warn("Logo failed to load for watermarking, skipping...");
                    resolve(dataUrl);
                };
            };
            img.onerror = reject;
        });
    };

    const handleUpload = async (toUpload: {file: File | null, preview: string}[]) => {
        setIsUploading(true);
        setStatus('idle');
        setUploadProgress(0);

        try {
            const uploadedUrls: string[] = [];

            for (let i = 0; i < toUpload.length; i++) {
                const item = toUpload[i];
                
                if (item.preview && (item.preview.startsWith('/') || item.preview.startsWith('http'))) {
                    uploadedUrls.push(item.preview);
                    continue;
                }

                if (item.file) {
                    const filename = forceFilename || sanitizeFilename(item.file.name);
                    let fileType = item.file.type;
                    let base64 = item.preview;
                    
                    if (fileType.startsWith('image/')) {
                        base64 = await processImage(item.preview);
                        fileType = 'image/jpeg';
                    }

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename, content: base64, type: fileType })
                    });

                    const data = await response.json();
                    if (data.success && data.url) {
                        uploadedUrls.push(data.url);
                    } else {
                        throw new Error(data.error || 'Upload échoué');
                    }
                }
                
                setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
            }

            setStatus('success');
            setMessage('Média(s) prêt(s) !');
            
            if (onUploadSuccess && uploadedUrls.length > 0) {
                onUploadSuccess(allowMultiple ? uploadedUrls : uploadedUrls[0]);
            }

            setTimeout(() => {
                onClose();
                setStatus('idle');
                setStep('idle');
                setSelectedImages([]);
            }, 1000);

        } catch (err: any) {
            console.error('Upload error:', err);
            setStatus('error');
            setMessage('Erreur: ' + (err.message || 'Connexion échouée'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onUploadSuccess) {
            onUploadSuccess(allowMultiple ? [] : '');
            onClose();
        }
    };

    const hasVideo = selectedImages.some(img => img.file?.type.startsWith('video/'));

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
                    <div className="flex min-h-full items-center justify-center p-6 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-2xl"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`relative w-full ${status === 'idle' && step !== 'preview' ? 'max-w-7xl' : 'max-w-lg'} bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-3xl overflow-hidden text-left my-8 transition-all duration-500`}
                        >
                            <div className={`absolute top-0 right-0 w-64 h-64 ${bgClass.replace('/20', '/5')} rounded-full blur-[100px] pointer-events-none`} />

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 ${bgClass} rounded-2xl border border-white/5 shadow-inner`}>
                                        <Upload className={`w-7 h-7 ${textClass}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                            Cloud <span className={textClass}>Upload</span>
                                        </h2>
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Multi-Upload & Watermarking</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white group">
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="space-y-6 relative z-10">
                                {status === 'success' ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                                        </motion.div>
                                        <p className="font-bold text-white uppercase tracking-widest">Upload Terminé !</p>
                                        <p className="text-xs text-gray-400">Vos médias sont en ligne sur Dropsiders Cloud.</p>
                                    </div>
                                ) : step === 'preview' && selectedImages.length > 0 ? (
                                    <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
                                        <div className="flex flex-col gap-3">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-2">Aperçu du rendu final :</p>
                                            <div className="grid grid-cols-1 gap-4">
                                                {selectedImages.map((img, idx) => (
                                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-6 overflow-hidden h-24 relative group">
                                                        {/* Mock Card Preview */}
                                                        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                                                        
                                                        {/* Image */}
                                                        <div className="w-24 h-full flex-shrink-0 relative">
                                                            {img.file?.type.startsWith('video/') ? (
                                                                <video src={img.preview} className="w-full h-full object-cover" muted />
                                                            ) : (
                                                                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                                            )}
                                                            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-neon-cyan text-black rounded-lg">
                                                                <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                                                                <span className="text-[6px] font-black uppercase">LIVE</span>
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 flex flex-col justify-center gap-1">
                                                            <div className="h-4 w-32 bg-white/10 rounded-full animate-pulse mb-1" />
                                                            <div className="h-2 w-20 bg-white/5 rounded-full" />
                                                        </div>
                                                        
                                                        {/* Progress bar mock */}
                                                        <div className="absolute bottom-0 left-0 h-1 bg-neon-cyan/50 w-2/3" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Watermark Toggle */}
                                        {!hasVideo && (
                                            <button 
                                                onClick={() => setIsWatermarkEnabled(!isWatermarkEnabled)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isWatermarkEnabled ? 'bg-neon-cyan/10 border-neon-cyan/40 shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'bg-white/5 border-white/10 opacity-70'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Layers className={`w-4 h-4 ${isWatermarkEnabled ? 'text-neon-cyan' : 'text-gray-500'}`} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isWatermarkEnabled ? 'text-white' : 'text-gray-400'}`}>Watermark Dropsiders</span>
                                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Ajoute le logo en haut à gauche</span>
                                                    </div>
                                                </div>
                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isWatermarkEnabled ? 'bg-neon-cyan' : 'bg-gray-700'}`}>
                                                    <div className={`absolute top-0.5 bottom-0.5 w-3 h-3 bg-white rounded-full transition-all ${isWatermarkEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                                </div>
                                            </button>
                                        )}

                                        <div className={`grid ${allowMultiple || hasVideo ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                                            {!allowMultiple && !hasVideo && (
                                                <button onClick={() => setIsCropOpen(true)} className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-neon-red/30 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/60 transition-all group">
                                                    <div className="p-3 bg-neon-red/20 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Crop className="w-6 h-6 text-neon-red" />
                                                    </div>
                                                    <span className="text-xs font-black text-white uppercase tracking-widest">Rogner</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleUpload(selectedImages)}
                                                disabled={isUploading}
                                                className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-neon-blue/30 rounded-2xl hover:bg-neon-blue/10 hover:border-neon-blue/60 transition-all group disabled:opacity-50"
                                            >
                                                <div className="p-3 bg-neon-blue/20 rounded-xl group-hover:scale-110 transition-transform relative">
                                                    {isUploading ? (
                                                        <div className="relative">
                                                            <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
                                                            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white">{uploadProgress}%</span>
                                                        </div>
                                                    ) : (
                                                        <Zap className="w-6 h-6 text-neon-blue" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-black text-white uppercase tracking-widest">
                                                    {isUploading ? 'Chargement...' : 
                                                     (selectedImages.every(i => !i.file) ? 'Valider la sélection' : 
                                                     (allowMultiple ? `Lancer l'envoi (${selectedImages.length})` : 'Uploader Direct'))}
                                                </span>
                                            </button>
                                        </div>
                                        <button onClick={() => { setStep('idle'); setSelectedImages([]); }} className="w-full py-2 text-[10px] text-gray-500 hover:text-white font-black uppercase tracking-widest transition-colors">
                                            ← Annuler et changer
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Upload Area */}
                                        <div className="lg:col-span-4 space-y-4">
                                            <label className="block group cursor-pointer w-full">
                                                <input type="file" accept="image/*,video/*" multiple={allowMultiple} className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                                <div className={`p-8 bg-white/5 border-2 border-dashed ${isUploading ? 'border-neon-cyan' : 'border-white/10 group-hover:border-neon-red/50'} rounded-[32px] flex flex-col items-center gap-4 transition-all hover:bg-white/[0.08]`}>
                                                    <div className="flex gap-4">
                                                        <ImageIcon className="w-10 h-10 text-gray-700 group-hover:text-neon-red transition-colors" />
                                                        {allowMultiple && <Film className="w-10 h-10 text-gray-700 group-hover:text-neon-blue transition-colors" />}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-white uppercase tracking-widest text-[10px] mb-1">{allowMultiple ? 'MULTI-UPLOAD' : 'FICHIER UNIQUE'}</p>
                                                        <p className="text-[8px] text-gray-600 uppercase font-black italic">Cliquez ou glissez-déposez</p>
                                                    </div>
                                                </div>
                                            </label>

                                            {initialImage && (
                                                <button onClick={handleClear} className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/10 transition-all group">
                                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Supprimer l'actuel</span>
                                                </button>
                                            )}
                                            
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-2">Instructions</p>
                                                <ul className="text-[8px] text-gray-600 space-y-1 font-bold uppercase italic">
                                                    <li>• JPG/PNG haute résolution conseillé</li>
                                                    <li>• MP4 optimisé pour le web</li>
                                                    <li>• Watermark ajoutable à l'étape suivante</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Gallery Area */}
                                        <div className="lg:col-span-8 flex flex-col gap-4 border-l border-white/5 pl-8">
                                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <HardDrive className="w-4 h-4 text-neon-blue" />
                                                        <span className="font-black text-[10px] text-white uppercase tracking-widest">Librairie Cloud</span>
                                                    </div>
                                                    <div className="h-4 w-px bg-white/10" />
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpDown className="w-3 h-3 text-gray-500" />
                                                        <select 
                                                            value={sortBy} 
                                                            onChange={(e) => setSortBy(e.target.value as any)}
                                                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold text-white outline-none focus:border-neon-blue transition-all uppercase"
                                                        >
                                                            <option value="newest">Récent</option>
                                                            <option value="oldest">Ancien</option>
                                                            <option value="name">Nom</option>
                                                            <option value="unused">Non utilisées 🗑️</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic">{r2Photos.length} fichiers</span>
                                            </div>

                                            {r2Loading && r2Photos.length === 0 ? (
                                                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-neon-blue" /></div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 max-h-[70vh] overflow-y-auto no-scrollbar rounded-3xl p-4 w-full auto-rows-max content-start">
                                                        {r2Photos.map(photo => (
                                                            <div 
                                                                key={photo.key} 
                                                                onClick={() => {
                                                                    const isSelected = selectedImages.some(img => img.preview === photo.url);
                                                                    if (allowMultiple) {
                                                                        if (isSelected) {
                                                                            setSelectedImages(prev => prev.filter(img => img.preview !== photo.url));
                                                                        } else {
                                                                            setSelectedImages(prev => [...prev, { file: null, preview: photo.url }]);
                                                                        }
                                                                    } else {
                                                                        handleUpload([{ file: null, preview: photo.url }]);
                                                                    }
                                                                }}
                                                                className={`relative w-full aspect-square min-h-[100px] md:min-h-[120px] bg-[#111] border-2 rounded-2xl md:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 group shadow-lg ${selectedImages.some(img => img.preview === photo.url) ? 'border-neon-blue ring-4 ring-neon-blue/20 scale-[0.98]' : 'border-white/5 hover:border-white/10 hover:scale-[1.02]'}`}
                                                            >
                                                                <img  
                                                                    src={photo.url} 
                                                                    alt="" 
                                                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${selectedImages.some(img => img.preview === photo.url) ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} 
                                                                />
                                                                
                                                                {selectedImages.some(img => img.preview === photo.url) && (
                                                                    <div className="absolute top-6 right-6 w-10 h-10 bg-neon-blue rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-300 z-20">
                                                                        <div className="text-sm font-black text-black">
                                                                            {allowMultiple ? selectedImages.findIndex(img => img.preview === photo.url) + 1 : <Check className="w-5 h-5" strokeWidth={4} />}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="absolute inset-x-0 bottom-0 bg-black/90 backdrop-blur-xl p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 border-t border-white/10">
                                                                    <span className="text-[10px] font-black text-white block truncate text-center uppercase tracking-[0.2em]">{photo.key.split('/').pop()}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div ref={sentinelRef} className="col-span-full h-32 flex items-center justify-center">
                                                            {r2Loading && <Loader2 className="w-10 h-10 animate-spin text-neon-blue" />}
                                                        </div>
                                                    </div>
                                                    
                                                    {allowMultiple && selectedImages.length > 0 && (
                                                        <div className="mt-4 flex justify-end">
                                                            <button
                                                                onClick={() => handleUpload(selectedImages)}
                                                                disabled={isUploading}
                                                                className="px-8 py-3 bg-neon-blue text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all text-[11px] shadow-lg shadow-neon-blue/20 flex items-center gap-2"
                                                            >
                                                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                                                Valider la sélection ({selectedImages.length})
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                                        {message}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
            {isCropOpen && selectedImages[0] && (
                <ImageCropper
                    image={selectedImages[0].preview}
                    aspect={aspect}
                    onCropComplete={(cropped) => {
                        setIsCropOpen(false);
                        handleUpload([{ file: null, preview: cropped }]);
                    }}
                    onCancel={() => setIsCropOpen(false)}
                />
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
}
