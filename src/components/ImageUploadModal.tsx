// Image Upload Modal component with Cloudinary integration
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Film, Crop, Zap, Trash2 } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: (url: string) => void;
    onClear?: () => void;
    accentColor?: string; // e.g. 'neon-pink', 'neon-red', etc. (Tailwind class part)
    aspect?: number;
    initialImage?: string;
}

export function ImageUploadModal({ isOpen, onClose, onUploadSuccess, onClear, accentColor = 'neon-pink', aspect, initialImage }: ImageUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

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

    const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isCropOpen, setIsCropOpen] = useState(false);
    // Step: 'idle' | 'preview' (image selected, awaiting crop/direct choice)
    const [step, setStep] = useState<'idle' | 'preview'>(initialImage ? 'preview' : 'idle');

    // Effect to handle initial image changes when modal opens/closes
    useEffect(() => {
        if (isOpen && initialImage) {
            setSelectedImage(initialImage);
            setStep('preview');
        } else if (!isOpen) {
            // Reset state when closing
            setSelectedImage(null);
            setSelectedFile(null);
            setStep('idle');
            setStatus('idle');
        }
    }, [isOpen, initialImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            // Show preview for videos instead of immediate upload
            setSelectedFile(file);
            setSelectedImage(URL.createObjectURL(file)); // Temp URL for preview
            setStep('preview');
        } else {
            // Load the image and show the crop/direct choice
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setSelectedFile(file);
                setStep('preview');
            };
        }
    };

    const handleUpload = async (base64OrFile: string | File) => {
        setIsUploading(true);
        setStatus('idle');

        try {
            let base64: string;
            let filename: string;
            let fileType: string;

            if (base64OrFile instanceof File) {
                filename = base64OrFile.name;
                fileType = base64OrFile.type;
                base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(base64OrFile);
                });
            } else {
                // assume it's a base64 from cropper
                base64 = base64OrFile;
                filename = `cropped-${Date.now()}.jpg`;
                fileType = 'image/jpeg';
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Add auth headers if needed, but worker usually handles it or checks session
                },
                body: JSON.stringify({
                    filename,
                    content: base64,
                    type: fileType
                })
            });

            const data = await response.json();

            if (data.success && data.url) {
                setStatus('success');
                setMessage('Média hébergé avec succès !');
                if (onUploadSuccess) onUploadSuccess(data.url);
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setStep('idle');
                    setSelectedImage(null);
                    setSelectedFile(null);
                }, 1500);
            } else {
                setStatus('error');
                setMessage('Erreur: ' + (data.error || 'Upload échoué'));
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setStatus('error');
            setMessage('Erreur de connexion');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setStep('idle');
        setSelectedImage(null);
        setSelectedFile(null);
        setStatus('idle');
    };

    const isVideo = selectedFile?.type.startsWith('video/') || (typeof selectedImage === 'string' && selectedImage.includes('/video/upload/'));

    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onUploadSuccess) {
            onUploadSuccess('');
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[40px] p-10 shadow-3xl overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-64 h-64 ${bgClass.replace('/20', '/5')} rounded-full blur-[100px] pointer-events-none`} />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={`p-4 ${bgClass} rounded-2xl border border-white/5 shadow-inner`}>
                                    <Upload className={`w-7 h-7 ${textClass}`} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                        Cloud <span className={textClass}>Upload</span>
                                    </h2>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Hébergement Dropsiders Sécurisé</p>
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
                                    <p className="text-xs text-gray-500">L'image a été ajoutée à votre contenu.</p>
                                </div>
                            ) : step === 'preview' && selectedImage ? (
                                /* ── Image/Video selected: choose crop or direct upload ── */
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col gap-5"
                                >
                                    {/* Preview */}
                                    <div className="w-full h-48 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                        {isVideo ? (
                                            <video src={selectedImage} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                                        ) : (
                                            <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                                        {isVideo ? "Prêt pour l'envoi de la vidéo" : "Que souhaitez-vous faire avec cette image ?"}
                                    </p>
                                    <div className={`grid ${isVideo ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                                        {/* Crop option - Hide for videos or external URLs that might have CORS issues */}
                                        {!isVideo && (
                                            <button
                                                onClick={() => setIsCropOpen(true)}
                                                className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-neon-red/30 rounded-2xl hover:bg-neon-red/10 hover:border-neon-red/60 transition-all group"
                                            >
                                                <div className="p-3 bg-neon-red/20 rounded-xl group-hover:scale-110 transition-transform">
                                                    <Crop className="w-6 h-6 text-neon-red" />
                                                </div>
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Rogner</span>
                                                <span className="text-[10px] text-gray-500 text-center">Recadrer avant l'upload</span>
                                            </button>
                                        )}
                                        {/* Direct upload option */}
                                        <button
                                            onClick={() => selectedFile ? handleUpload(selectedFile) : (typeof selectedImage === 'string' && handleUpload(selectedImage))}
                                            disabled={isUploading}
                                            className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-neon-blue/30 rounded-2xl hover:bg-neon-blue/10 hover:border-neon-blue/60 transition-all group disabled:opacity-50"
                                        >
                                            <div className="p-3 bg-neon-blue/20 rounded-xl group-hover:scale-110 transition-transform">
                                                {isUploading ? (
                                                    <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
                                                ) : (
                                                    <Zap className="w-6 h-6 text-neon-blue" />
                                                )}
                                            </div>
                                            <span className="text-xs font-black text-white uppercase tracking-widest">
                                                {isUploading ? 'Envoi...' : (isVideo ? "Confirmer l'envoi" : 'Direct')}
                                            </span>
                                            <span className="text-[10px] text-gray-500 text-center">{isVideo ? "Uploader sur Cloudinary" : "Uploader sans recadrer"}</span>
                                        </button>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleCancel}
                                            className="w-full py-3 text-xs text-gray-500 hover:text-white font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                        >
                                            ← {initialImage ? "Quitter sans modifier" : "Changer de média"}
                                        </button>

                                        {initialImage && (
                                            <button
                                                onClick={handleClear}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Vider (Supprimer)
                                            </button>
                                        )}
                                    </div>

                                    {status === 'error' && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                                            {message}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <>
                                    <label className={`block group cursor-pointer`}>
                                        <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                                        <div className={`p-12 bg-white/5 border-2 border-dashed ${isUploading ? 'border-neon-cyan' : 'border-white/10 group-hover:border-neon-red/50'} rounded-[32px] flex flex-col items-center gap-4 transition-all hover:bg-white/[0.08]`}>
                                            {isUploading ? (
                                                <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
                                            ) : (
                                                <div className="flex gap-4">
                                                    <ImageIcon className="w-12 h-12 text-gray-700 group-hover:text-neon-red transition-colors" />
                                                    <Film className="w-12 h-12 text-gray-700 group-hover:text-neon-blue transition-colors" />
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <p className="font-bold text-white uppercase tracking-widest text-sm mb-1">
                                                    {isUploading ? 'Envoi en cours...' : 'Cliquez pour uploader'}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black">PNG, JPG, WEBP, MP4 • Max 100MB</p>
                                            </div>
                                        </div>
                                    </label>

                                    {status === 'error' && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                                            {message}
                                        </div>
                                    )}

                                    {/* Empty / Clear Option */}
                                    <div className="pt-4 border-t border-white/5">
                                        <button
                                            onClick={handleClear}
                                            className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all group"
                                        >
                                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-black uppercase tracking-widest">Vider (Supprimer)</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            {isCropOpen && selectedImage && (
                <ImageCropper
                    image={selectedImage}
                    aspect={aspect}
                    onCropComplete={(cropped) => {
                        setIsCropOpen(false);
                        handleUpload(cropped);
                    }}
                    onCancel={() => {
                        setIsCropOpen(false);
                        // Go back to preview step (don't clear image)
                    }}
                />
            )}
        </AnimatePresence>
    );
}
