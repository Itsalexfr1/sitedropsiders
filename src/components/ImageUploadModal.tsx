// Image Upload Modal component with Cloudflare R2 integration
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Film, Crop, Zap, Trash2, Layers } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: (urls: string | string[]) => void;
    onClear?: () => void;
    accentColor?: string; // e.g. 'neon-pink', 'neon-red', etc. (Tailwind class part)
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
    accentColor = 'neon-pink', 
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
    let bgClass = "bg-neon-pink/20";
    let textClass = "text-neon-pink";

    if (accentColor === 'neon-red') {
        bgClass = "bg-neon-red/20";
        textClass = "text-neon-red";
    } else if (accentColor === 'neon-blue') {
        bgClass = "bg-neon-blue/20";
        textClass = "text-neon-blue";
    }

    const [selectedImages, setSelectedImages] = useState<{file: File | null, preview: string}[]>([]);
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [step, setStep] = useState<'idle' | 'preview'>(initialImage ? 'preview' : 'idle');
    const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(watermark);

    useEffect(() => {
        if (isOpen && initialImage) {
            setSelectedImages([{ file: null, preview: initialImage }]);
            setStep('preview');
        } else if (!isOpen) {
            setSelectedImages([]);
            setStep('idle');
            setStatus('idle');
            setUploadProgress(0);
        }
    }, [isOpen, initialImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newImages: {file: File, preview: string}[] = [];
        let processedCount = 0;

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    newImages.push({ file, preview: reader.result as string });
                    processedCount++;
                    if (processedCount === files.length) {
                        setSelectedImages(newImages);
                        setStep('preview');
                    }
                };
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('video/')) {
                newImages.push({ file, preview: URL.createObjectURL(file) });
                processedCount++;
                if (processedCount === files.length) {
                    setSelectedImages(newImages);
                    setStep('preview');
                }
            }
        });
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
                let base64: string;
                let filename: string;
                let fileType: string;

                if (item.file) {
                    filename = item.file.name;
                    fileType = item.file.type;
                    
                    if (fileType.startsWith('image/')) {
                        // Apply watermark if enabled
                        base64 = await processImage(item.preview);
                        fileType = 'image/jpeg';
                    } else {
                        // Video: upload as is
                        base64 = item.preview;
                    }
                } else {
                    // Pre-existing or weird state
                    base64 = item.preview;
                    filename = `image-${Date.now()}-${i}.jpg`;
                    fileType = 'image/jpeg';
                }

                if (forceFilename) {
                    filename = forceFilename;
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
                
                setUploadProgress(Math.round(((i + 1) / toUpload.length) * 100));
            }

            setStatus('success');
            setMessage('Média(s) hébergé(s) avec succès !');
            
            if (onUploadSuccess) {
                onUploadSuccess(allowMultiple ? uploadedUrls : uploadedUrls[0]);
            }

            setTimeout(() => {
                onClose();
                setStatus('idle');
                setStep('idle');
                setSelectedImages([]);
            }, 1500);

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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] overflow-y-auto">
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
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-3xl overflow-hidden text-left my-8"
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
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar rounded-2xl border border-white/10 p-2 bg-black/40">
                                        {selectedImages.map((img, idx) => (
                                            <div key={idx} className="aspect-video relative rounded-lg overflow-hidden border border-white/5">
                                                {img.file?.type.startsWith('video/') ? (
                                                    <video src={img.preview} className="w-full h-full object-cover" muted />
                                                ) : (
                                                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ))}
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
                                                {isUploading ? 'Chargement...' : (allowMultiple ? `Lancer l'envoi (${selectedImages.length})` : 'Uploader Direct')}
                                            </span>
                                        </button>
                                    </div>
                                    <button onClick={() => { setStep('idle'); setSelectedImages([]); }} className="w-full py-2 text-[10px] text-gray-500 hover:text-white font-black uppercase tracking-widest transition-colors">
                                        ← Annuler et changer
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    <label className="block group cursor-pointer">
                                        <input type="file" accept="image/*,video/*" multiple={allowMultiple} className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                        <div className={`p-12 bg-white/5 border-2 border-dashed ${isUploading ? 'border-neon-cyan' : 'border-white/10 group-hover:border-neon-pink/50'} rounded-[32px] flex flex-col items-center gap-4 transition-all hover:bg-white/[0.08]`}>
                                            <div className="flex gap-4">
                                                <ImageIcon className="w-12 h-12 text-gray-700 group-hover:text-neon-pink transition-colors" />
                                                {allowMultiple && <Film className="w-12 h-12 text-gray-700 group-hover:text-neon-blue transition-colors" />}
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-white uppercase tracking-widest text-sm mb-1">{allowMultiple ? 'Glissez plusieurs fichiers' : 'Choisissez un média'}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black">Format JPG, PNG, MP4 supportés</p>
                                            </div>
                                        </div>
                                    </label>
                                    
                                    {initialImage && (
                                        <button onClick={handleClear} className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all group">
                                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-black uppercase tracking-widest">Supprimer l'actuel</span>
                                        </button>
                                    )}
                                </>
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
}
