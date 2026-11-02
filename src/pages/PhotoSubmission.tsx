import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Send, CheckCircle2, Upload, X, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import wikiFestivals from '../data/wiki_festivals.json';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { enhanceFestivalPhoto, type FestivalSceneMode } from '../utils/festivalPhotoEnhancer';

export function PhotoSubmission() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isFestivalProEnabled, setIsFestivalProEnabled] = useState(false);
    const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
    const [detectedMode, setDetectedMode] = useState<FestivalSceneMode | null>(null);
    const [festivalName, setFestivalName] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showAlert, setShowAlert] = useState<{ isOpen: boolean, message: string }>({ isOpen: false, message: '' });

    useEffect(() => {
        if (!isFestivalProEnabled || (!selectedFile && !preview)) {
            setEnhancedPreview(null);
            setDetectedMode(null);
            return;
        }
        let cancelled = false;
        enhanceFestivalPhoto(selectedFile || preview!, {
            fileForExif: selectedFile,
            maxDimension: 1280,
            quality: 0.90
        })
            .then((res) => {
                if (cancelled) return;
                setEnhancedPreview(res.dataUrl);
                setDetectedMode(res.mode);
            })
            .catch(() => {
                if (!cancelled) {
                    setEnhancedPreview(null);
                    setDetectedMode(null);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [isFestivalProEnabled, selectedFile, preview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!preview) return;
        setIsSubmitting(true);

        try {
            let finalContent = preview;
            if (isFestivalProEnabled) {
                const enhanced = await enhanceFestivalPhoto(selectedFile || preview, {
                    fileForExif: selectedFile
                });
                finalContent = enhanced.dataUrl;
            }

            // 1. Upload the image first to our secure hosting
            // We'll use the same /api/upload endpoint as the rest of the site
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: `submission-${Date.now()}.jpg`,
                    content: finalContent,
                    type: 'image/jpeg'
                })
            });

            if (!uploadResponse.ok) throw new Error('Erreur lors de l\'hébergement de l\'image');
            const uploadData = await uploadResponse.json();
            const imageUrl = uploadData.url;

            // 2. Submit the metadata to the moderation queue
            const formData = new FormData(e.currentTarget as HTMLFormElement);
            const submission = {
                userName: formData.get('userName') as string,
                festivalName: formData.get('festivalName') as string,
                year: formData.get('year') as string,
                instagram: formData.get('instagram') as string,
                anecdote: formData.get('anecdote') as string,
                imageUrl: imageUrl,
                timestamp: new Date().toISOString()
            };

            const submitResponse = await fetch('/api/photos/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission)
            });

            if (!submitResponse.ok) throw new Error('Erreur lors de la soumission');

            setIsSuccess(true);
            setTimeout(() => navigate('/communaute'), 3000);
        } catch (error: any) {
            console.error('Submission error:', error);
            setShowAlert({ isOpen: true, message: 'Désolé, une erreur est survenue lors de l\'envoi. Réessayez plus tard.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4">
            <div className="max-w-xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/[0.02] border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-red/10 blur-[100px] rounded-full pointer-events-none" />

                    {!isSuccess ? (
                        <div className="relative z-10 space-y-8">
                            <button
                                onClick={() => navigate('/communaute')}
                                className="group flex items-center gap-2 text-gray-500 hover:text-white transition-all transform hover:-translate-x-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">RETOUR</span>
                            </button>

                            <div className="text-center space-y-4">
                                <div className="inline-flex p-3 bg-neon-red/10 rounded-2xl mb-2">
                                    <Camera className="w-8 h-8 text-neon-red" />
                                </div>
                                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                                    PARTAGE TES <span className="text-neon-red">SOUVENIRS</span>
                                </h1>
                                <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                                    Tes photos seront examinées par la team et ajoutées à la galerie communautaire.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="userName"
                                            required
                                            placeholder="TON NOM / PSEUDO *"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-black uppercase tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-neon-red">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            name="festivalName"
                                            required
                                            value={festivalName}
                                            onChange={(e) => {
                                                setFestivalName(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder="NOM DU FESTIVAL *"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white text-xs font-black uppercase tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                        />
                                        {showSuggestions && festivalName && (
                                            <div className="absolute z-50 left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl backdrop-blur-xl">
                                                {wikiFestivals.filter(f => f.name.toLowerCase().includes(festivalName.toLowerCase())).length > 0 ? (
                                                    wikiFestivals.filter(f => f.name.toLowerCase().includes(festivalName.toLowerCase())).map(f => (
                                                        <button
                                                            key={f.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFestivalName(f.name);
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-neon-red/10 hover:text-neon-red text-gray-300 text-sm font-bold uppercase transition-colors"
                                                        >
                                                            {f.name}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-xs text-gray-400 italic">
                                                        Nouveau festival. Il sera ajouté au Wiki !
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            name="year"
                                            required
                                            min="2000"
                                            max="2030"
                                            defaultValue={new Date().getFullYear()}
                                            placeholder="ANNÉE *"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-black uppercase tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="instagram"
                                            placeholder="TON INSTAGRAM (POUR TE TAGUER)"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-black uppercase tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-neon-red transition-all"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            name="anecdote"
                                            placeholder="UNE ANECDOTE SUR CE MOMENT ? (OPTIONNEL)"
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-black uppercase tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-neon-red transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="relative space-y-3">
                                    {preview ? (
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-neon-red shadow-[0_0_30px_rgba(255,17,17,0.2)]">
                                            <img src={isFestivalProEnabled && enhancedPreview ? enhancedPreview : preview} alt="Preview" className="w-full h-full object-cover transition-all duration-300" />
                                            {isFestivalProEnabled && detectedMode && (
                                                <div className="absolute top-4 left-4 px-3 py-1 bg-black/75 backdrop-blur-md border border-amber-400/40 rounded-full flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">
                                                        {detectedMode === 'NIGHT_INDOOR' ? 'Nuit / Indoor' : 'Jour / Outdoor'}
                                                    </span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreview(null);
                                                    setSelectedFile(null);
                                                }}
                                                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:text-neon-red transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center aspect-video rounded-[30px] border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer group">
                                            <Upload className="w-10 h-10 text-gray-600 group-hover:text-white transition-colors mb-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                                                GLISSE TA PHOTO OU CLIQUE ICI
                                            </span>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setIsFestivalProEnabled(!isFestivalProEnabled)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${isFestivalProEnabled ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.12)]' : 'bg-white/[0.03] border-white/10 opacity-75 hover:opacity-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Sparkles className={`w-4 h-4 shrink-0 ${isFestivalProEnabled ? 'text-amber-400' : 'text-gray-500'}`} />
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isFestivalProEnabled ? 'text-white' : 'text-gray-400'}`}>
                                                    Amélioration Festival Pro (Auto)
                                                </span>
                                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">
                                                    {isFestivalProEnabled && detectedMode
                                                        ? `Mode auto : ${detectedMode === 'NIGHT_INDOOR' ? 'Nuit / Indoor' : 'Jour / Outdoor'}`
                                                        : 'Détection auto Jour / Nuit & étalonnage pro'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${isFestivalProEnabled ? 'bg-amber-400' : 'bg-gray-700'}`}>
                                            <div className={`absolute top-0.5 bottom-0.5 w-3 h-3 bg-white rounded-full transition-all ${isFestivalProEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                        </div>
                                    </button>
                                </div>

                                <button
                                    disabled={isSubmitting || !preview}
                                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:shadow-[0_0_40px_rgba(255,17,17,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            ENVOYER LA PHOTO
                                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12 space-y-6"
                        >
                            <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(57,255,20,0.2)]">
                                <CheckCircle2 className="w-10 h-10 text-neon-green" />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                                MERCI POUR <span className="text-neon-green">L'ENVOI !</span>
                            </h2>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                                Ta photo a été transmise à l'équipe. <br />
                                On s'occupe de la modération ASAP !
                            </p>
                            <div className="pt-8 pt-pb-8">
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 3 }}
                                        className="h-full bg-neon-green"
                                    />
                                </div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-gray-700 mt-4">
                                    RETOUR VERS LA COMMUNAUTÉ DANS QUELQUES SECONDES
                                </p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            <ConfirmationModal
                isOpen={showAlert.isOpen}
                title="Erreur d'envoi"
                message={showAlert.message}
                confirmLabel="OK"
                cancelLabel="Fermer"
                onConfirm={() => setShowAlert({ isOpen: false, message: '' })}
                onCancel={() => setShowAlert({ isOpen: false, message: '' })}
                accentColor="neon-red"
            />
        </div>
    );
}
