import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Truck, Sparkles, Package, ChevronRight, ChevronLeft, Loader2, Printer, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import type { DropsidersCard } from '../../context/UserContext';
import { CardPrintExporter, blobToBase64, type CardPrintExporterHandle } from './CardPrintExporter';
import { useUser } from '../../context/UserContext';

interface CardPrintOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    card: DropsidersCard | null;
}

type Step = 'finish' | 'preview' | 'shipping' | 'submitting' | 'tracker';
type Finish = 'standard' | 'foil';

interface ShippingAddress {
    name: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
}

export function CardPrintOrderModal({ isOpen, onClose, card }: CardPrintOrderModalProps) {
    const { user, showNotification } = useUser();
    const [step, setStep] = useState<Step>('finish');
    const [finish, setFinish] = useState<Finish>('standard');
    
    // Preview states
    const [isExporting, setIsExporting] = useState(false);
    const [previewFront, setPreviewFront] = useState<string | null>(null);
    const [previewBack, setPreviewBack] = useState<string | null>(null);
    const [previewMask, setPreviewMask] = useState<string | null>(null);
    const [activePreviewTab, setActivePreviewTab] = useState<'front' | 'back' | 'mask'>('front');

    // Shipping state
    const [shipping, setShipping] = useState<ShippingAddress>({
        name: user?.username || '',
        line1: '',
        city: '',
        postalCode: '',
        country: 'France'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

    // Upload & order states
    const [uploadProgress, setUploadProgress] = useState('');
    const [orderResult, setOrderResult] = useState<{
        orderId: string;
        estimatedDays: number;
        estimatedPrice: number;
        trackingUrl?: string;
    } | null>(null);

    // Live Tracker state
    const [trackerStatus, setTrackerStatus] = useState<'pending' | 'printing' | 'shipped' | 'delivered'>('pending');
    const [trackerTrackingUrl, setTrackerTrackingUrl] = useState<string | undefined>(undefined);
    const [trackerTrackingNumber, setTrackerTrackingNumber] = useState<string | undefined>(undefined);
    const [isPolling, setIsPolling] = useState(false);

    const exporterRef = useRef<CardPrintExporterHandle>(null);

    // Reset when modal closes or card changes
    useEffect(() => {
        if (!isOpen) {
            setStep('finish');
            setPreviewFront(null);
            setPreviewBack(null);
            setPreviewMask(null);
            setActivePreviewTab('front');
            setOrderResult(null);
            setIsPolling(false);
        }
    }, [isOpen]);

    // Handle high definition PNG export for previews
    const generateHDPreviews = async () => {
        if (!exporterRef.current || !card) return;
        setIsExporting(true);
        try {
            // Front export
            const frontBlob = await exporterRef.current.exportFront();
            const frontUrl = URL.createObjectURL(frontBlob);
            setPreviewFront(frontUrl);

            // Back export
            const backBlob = await exporterRef.current.exportBack();
            const backUrl = URL.createObjectURL(backBlob);
            setPreviewBack(backUrl);

            // Foil mask export
            const maskBlob = await exporterRef.current.exportFoilMask();
            const maskUrl = URL.createObjectURL(maskBlob);
            setPreviewMask(maskUrl);

            setStep('preview');
        } catch (e: any) {
            console.error(e);
            showNotification("Erreur lors de la génération de l'aperçu HD : " + e.message, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    // Validate shipping form
    const validateShipping = () => {
        const errors: Partial<Record<keyof ShippingAddress, string>> = {};
        if (!shipping.name.trim()) errors.name = 'Nom complet obligatoire';
        if (!shipping.line1.trim()) errors.line1 = 'Adresse obligatoire';
        if (!shipping.city.trim()) errors.city = 'Ville obligatoire';
        if (!shipping.postalCode.trim()) errors.postalCode = 'Code postal obligatoire';
        if (!shipping.country.trim()) errors.country = 'Pays obligatoire';
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit order to API
    const handlePlaceOrder = async () => {
        if (!card || !exporterRef.current) return;
        setStep('submitting');
        
        try {
            setUploadProgress('Génération du rendu Recto à 300 DPI...');
            const frontBlob = await exporterRef.current.exportFront();
            const frontB64 = await blobToBase64(frontBlob);

            setUploadProgress('Génération du rendu Verso à 300 DPI...');
            const backBlob = await exporterRef.current.exportBack();
            const backB64 = await blobToBase64(backBlob);

            let maskB64: string | undefined = undefined;
            if (finish === 'foil') {
                setUploadProgress('Création du masque holographique sélectif...');
                const maskBlob = await exporterRef.current.exportFoilMask();
                maskB64 = await blobToBase64(maskBlob);
            }

            setUploadProgress("Envoi de l'ordre d'impression à MakePlayingCards...");
            
            const response = await fetch('/api/print/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardId: card.id,
                    frontImageBase64: frontB64,
                    backImageBase64: backB64,
                    foilMaskBase64: maskB64,
                    finish,
                    quantity: 1,
                    shippingAddress: shipping
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Erreur serveur');
            }

            const data = await response.json();
            setOrderResult({
                orderId: data.orderId,
                estimatedDays: data.estimatedDays,
                estimatedPrice: data.estimatedPrice,
                trackingUrl: data.trackingUrl
            });
            setTrackerStatus('pending');
            setStep('tracker');
            showNotification('Impression commandée avec succès !', 'success');
        } catch (e: any) {
            console.error(e);
            showNotification(e.message || 'Erreur lors de la commande', 'error');
            setStep('shipping');
        }
    };

    // Live status polling
    useEffect(() => {
        let timer: any;
        if (step === 'tracker' && orderResult?.orderId) {
            setIsPolling(true);
            const fetchStatus = async () => {
                try {
                    const res = await fetch(`/api/print/status?orderId=${orderResult.orderId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setTrackerStatus(data.status);
                        setTrackerTrackingUrl(data.trackingUrl);
                        setTrackerTrackingNumber(data.trackingNumber);
                    }
                } catch (err) {
                    console.error("Failed to poll status", err);
                }
            };

            // Run immediately
            fetchStatus();

            // Poll every 8 seconds
            timer = setInterval(fetchStatus, 8000);
        }

        return () => {
            if (timer) clearInterval(timer);
            setIsPolling(false);
        };
    }, [step, orderResult?.orderId]);

    if (!isOpen || !card) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
                />

                {/* Exporter (Off-screen component) */}
                <CardPrintExporter ref={exporterRef} card={card} />

                {/* Modal box */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="relative w-full max-w-2xl bg-zinc-950/80 border border-white/10 rounded-[36px] overflow-hidden backdrop-blur-3xl shadow-2xl z-10 flex flex-col max-h-[90vh]"
                >
                    {/* Top gradient indicator */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-neon-red via-purple-600 to-neon-cyan" />

                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                                <Printer className="w-5 h-5 text-neon-red" />
                            </div>
                            <div>
                                <h2 className="text-sm font-display font-black text-white italic uppercase tracking-wider">Impression Physique Premium</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{card.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Steps Navigator */}
                    {step !== 'submitting' && step !== 'tracker' && (
                        <div className="px-8 py-4 bg-white/[0.01] border-b border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500 select-none">
                            <div className={`flex items-center gap-2 ${step === 'finish' ? 'text-neon-cyan' : 'text-neon-green'}`}>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${step === 'finish' ? 'bg-neon-cyan/20 border border-neon-cyan' : 'bg-neon-green/20 border border-neon-green text-neon-green'}`}>
                                    {step === 'finish' ? '1' : <Check className="w-2.5 h-2.5" />}
                                </span>
                                Finition
                            </div>
                            <div className="w-8 h-px bg-white/10" />
                            <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-neon-cyan' : step !== 'finish' ? 'text-neon-green' : ''}`}>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${step === 'preview' ? 'bg-neon-cyan/20 border border-neon-cyan' : step !== 'finish' ? 'bg-neon-green/20 border border-neon-green text-neon-green' : 'bg-white/5 border border-white/10'}`}>
                                    {step === 'preview' ? '2' : step !== 'finish' ? <Check className="w-2.5 h-2.5" /> : '2'}
                                </span>
                                Aperçu HD
                            </div>
                            <div className="w-8 h-px bg-white/10" />
                            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-neon-cyan' : ''}`}>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${step === 'shipping' ? 'bg-neon-cyan/20 border border-neon-cyan' : 'bg-white/5 border border-white/10'}`}>
                                    3
                                </span>
                                Livraison
                            </div>
                        </div>
                    )}

                    {/* Content Body */}
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        <AnimatePresence mode="wait">
                            {step === 'finish' && (
                                <motion.div
                                    key="finish"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center space-y-1.5">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Choisis la finition de ta carte</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase italic leading-normal">
                                            Nos impressions utilisent du carton TCG premium de 300g avec vernis protecteur de haute qualité.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        {/* Standard Option */}
                                        <button
                                            onClick={() => setFinish('standard')}
                                            className={`p-6 rounded-[28px] border text-left transition-all duration-300 relative group overflow-hidden ${finish === 'standard' ? 'border-neon-cyan bg-neon-cyan/5 shadow-[0_0_20px_rgba(0,242,254,0.15)]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-[40px] pointer-events-none" />
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${finish === 'standard' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-gray-400'}`}>
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider leading-none mb-1">Prix total</p>
                                                    <p className="text-xl font-display font-black text-white leading-none">8,50 €</p>
                                                </div>
                                            </div>
                                            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">Finition Standard</h4>
                                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                                Rendu mat lisse antireflet avec des couleurs denses et profondes. Toucher cartonné authentique et tranches impeccables. Idéal pour admirer chaque détail graphique.
                                            </p>
                                        </button>

                                        {/* Foil Option */}
                                        <button
                                            onClick={() => setFinish('foil')}
                                            className={`p-6 rounded-[28px] border text-left transition-all duration-300 relative group overflow-hidden ${finish === 'foil' ? 'border-neon-red bg-neon-red/5 shadow-[0_0_20px_rgba(255,0,51,0.15)]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-red/5 rounded-full blur-[40px] pointer-events-none" />
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${finish === 'foil' ? 'bg-neon-red/20 text-neon-red' : 'bg-white/5 text-gray-400'}`}>
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider leading-none mb-1">Prix total</p>
                                                    <p className="text-xl font-display font-black text-white leading-none">12,50 €</p>
                                                </div>
                                            </div>
                                            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                Holographique / Foil <span className="px-1.5 py-0.5 bg-neon-red/10 border border-neon-red/30 rounded text-[7px] text-neon-red tracking-normal">Premium</span>
                                            </h4>
                                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                                                Traitement holographique prismatique sélectif. Brillance magique sur le contour extérieur de la carte et la boîte de l'illustration centrale. Reflets irisés spectaculaires à la lumière !
                                            </p>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'preview' && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6 flex flex-col items-center"
                                >
                                    <div className="text-center space-y-1 w-full">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Aperçu haute définition à 300 DPI</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase italic leading-normal">
                                            Voici le rendu exact que recevra l'imprimeur MPC pour fabriquer ta carte physique.
                                        </p>
                                    </div>

                                    {/* Preview Navigation */}
                                    <div className="p-1 bg-white/5 border border-white/10 rounded-xl flex items-center gap-1">
                                        <button
                                            onClick={() => setActivePreviewTab('front')}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${activePreviewTab === 'front' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Recto
                                        </button>
                                        <button
                                            onClick={() => setActivePreviewTab('back')}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${activePreviewTab === 'back' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Verso
                                        </button>
                                        {finish === 'foil' && (
                                            <button
                                                onClick={() => setActivePreviewTab('mask')}
                                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${activePreviewTab === 'mask' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Brillance Foil
                                            </button>
                                        )}
                                    </div>

                                    {/* Image frame */}
                                    <div className="w-[200px] h-[278px] bg-black border border-white/10 rounded-[20px] overflow-hidden shadow-2xl relative flex items-center justify-center p-1 bg-gradient-to-tr from-white/5 to-transparent">
                                        {activePreviewTab === 'front' && previewFront && (
                                            <img src={previewFront} alt="Rendu Recto HD" className="w-full h-full object-contain rounded-[16px]" />
                                        )}
                                        {activePreviewTab === 'back' && previewBack && (
                                            <img src={previewBack} alt="Rendu Verso HD" className="w-full h-full object-contain rounded-[16px]" />
                                        )}
                                        {activePreviewTab === 'mask' && previewMask && (
                                            <div className="relative w-full h-full rounded-[16px] overflow-hidden bg-black flex items-center justify-center">
                                                <img src={previewMask} alt="Masque Foil" className="w-full h-full object-contain filter invert-0" />
                                                <div className="absolute inset-0 bg-gradient-to-tr from-neon-red/10 to-neon-cyan/10 pointer-events-none animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-neon-cyan shrink-0" />
                                        <p className="text-[10px] text-gray-400 leading-relaxed">
                                            <span className="font-bold text-white">Zone de Bleed incluse (3mm) :</span> Les images ci-dessus incluent une marge de coupe noire de 35px sur les côtés pour assurer une coupe sans bordures blanches lors de la fabrication.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'shipping' && (
                                <motion.div
                                    key="shipping"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center space-y-1 w-full">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Adresse de Livraison</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase italic leading-normal">
                                            Renseigne tes coordonnées pour que l'imprimeur t'expédie directement ton colis.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Name */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Nom Complet du Destinataire</label>
                                                <input
                                                    type="text"
                                                    autoComplete="name"
                                                    value={shipping.name}
                                                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                                    placeholder="Ex: ALEXIS MARTIN"
                                                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-colors ${formErrors.name ? 'border-neon-red/50 focus:border-neon-red' : 'border-white/10'}`}
                                                />
                                                {formErrors.name && <p className="text-[9px] font-bold text-neon-red uppercase">{formErrors.name}</p>}
                                            </div>

                                            {/* Address Line 1 */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Adresse de Livraison</label>
                                                <input
                                                    type="text"
                                                    autoComplete="address-line1"
                                                    value={shipping.line1}
                                                    onChange={(e) => setShipping({ ...shipping, line1: e.target.value })}
                                                    placeholder="Ex: 12 Rue des Oliviers, Appt 4B"
                                                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-colors ${formErrors.line1 ? 'border-neon-red/50 focus:border-neon-red' : 'border-white/10'}`}
                                                />
                                                {formErrors.line1 && <p className="text-[9px] font-bold text-neon-red uppercase">{formErrors.line1}</p>}
                                            </div>

                                            {/* City & Zip */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Code Postal</label>
                                                    <input
                                                        type="text"
                                                        autoComplete="postal-code"
                                                        value={shipping.postalCode}
                                                        onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                                                        placeholder="Ex: 75001"
                                                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-colors ${formErrors.postalCode ? 'border-neon-red/50 focus:border-neon-red' : 'border-white/10'}`}
                                                    />
                                                    {formErrors.postalCode && <p className="text-[9px] font-bold text-neon-red uppercase">{formErrors.postalCode}</p>}
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Ville</label>
                                                    <input
                                                        type="text"
                                                        autoComplete="address-level2"
                                                        value={shipping.city}
                                                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                                        placeholder="Ex: PARIS"
                                                        className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-colors ${formErrors.city ? 'border-neon-red/50 focus:border-neon-red' : 'border-white/10'}`}
                                                    />
                                                    {formErrors.city && <p className="text-[9px] font-bold text-neon-red uppercase">{formErrors.city}</p>}
                                                </div>
                                            </div>

                                            {/* Country */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400">Pays</label>
                                                <input
                                                    type="text"
                                                    autoComplete="country-name"
                                                    value={shipping.country}
                                                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                                                    placeholder="France"
                                                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan transition-colors ${formErrors.country ? 'border-neon-red/50 focus:border-neon-red' : 'border-white/10'}`}
                                                />
                                                {formErrors.country && <p className="text-[9px] font-bold text-neon-red uppercase">{formErrors.country}</p>}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            {step === 'submitting' && (
                                <motion.div
                                    key="submitting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-12 flex flex-col items-center justify-center space-y-6 text-center"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-[20px] animate-pulse" />
                                        <Loader2 className="w-16 h-16 text-neon-cyan animate-spin relative" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest italic animate-pulse">Transmission de la commande...</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase italic">{uploadProgress}</p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'tracker' && orderResult && (
                                <motion.div
                                    key="tracker"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6 flex flex-col items-center"
                                >
                                    <div className="w-16 h-16 bg-neon-green/10 border border-neon-green/20 text-neon-green rounded-3xl flex items-center justify-center shadow-lg shadow-neon-green/10">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>

                                    <div className="text-center space-y-1.5 w-full">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Impression lancée !</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none">
                                            ID DE COMMANDE : <span className="text-neon-cyan font-black">{orderResult.orderId}</span>
                                        </p>
                                    </div>

                                    {/* Price and Speed Card */}
                                    <div className="grid grid-cols-2 gap-4 w-full pt-2">
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider mb-1">Montant facturé</p>
                                            <p className="text-lg font-display font-black text-white leading-none">{(orderResult.estimatedPrice / 100).toFixed(2)} €</p>
                                        </div>
                                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                            <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider mb-1">Livraison estimée</p>
                                            <p className="text-lg font-display font-black text-white leading-none">{orderResult.estimatedDays} jours</p>
                                        </div>
                                    </div>

                                    {/* Live Interactive Fulfillment Tracker */}
                                    <div className="w-full bg-black/40 border border-white/5 rounded-[24px] p-6 space-y-6 relative overflow-hidden">
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-neon-cyan animate-ping' : 'bg-gray-500'}`} />
                                            <span className="text-[7px] text-gray-600 font-black uppercase tracking-wider">Suivi en direct</span>
                                        </div>

                                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Fulfillment MakePlayingCards</h4>
                                        
                                        <div className="relative pl-8 space-y-6">
                                            {/* Line connector */}
                                            <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-white/10" />
                                            
                                            {/* Step 1: Pending */}
                                            <div className="relative flex flex-col gap-1">
                                                <div className={`absolute -left-[27px] w-5 h-5 rounded-full border flex items-center justify-center text-[9px] ${trackerStatus === 'pending' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,242,254,0.3)] animate-pulse' : 'bg-neon-green/20 border-neon-green text-neon-green'}`}>
                                                    {trackerStatus !== 'pending' ? <Check className="w-3 h-3" /> : '1'}
                                                </div>
                                                <p className={`text-[10px] font-black uppercase ${trackerStatus === 'pending' ? 'text-neon-cyan' : 'text-gray-400'}`}>Commande validée</p>
                                                <p className="text-[8px] text-gray-600 font-bold uppercase italic">Vérification technique des fichiers HD et transmission...</p>
                                            </div>

                                            {/* Step 2: Printing */}
                                            <div className="relative flex flex-col gap-1">
                                                <div className={`absolute -left-[27px] w-5 h-5 rounded-full border flex items-center justify-center text-[9px] ${trackerStatus === 'printing' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,242,254,0.3)] animate-pulse' : trackerStatus !== 'pending' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-zinc-900 border-white/10 text-gray-600'}`}>
                                                    {trackerStatus === 'shipped' || trackerStatus === 'delivered' ? <Check className="w-3 h-3" /> : '2'}
                                                </div>
                                                <p className={`text-[10px] font-black uppercase ${trackerStatus === 'printing' ? 'text-neon-cyan' : trackerStatus === 'shipped' || trackerStatus === 'delivered' ? 'text-gray-400' : 'text-gray-600'}`}>Impression en cours</p>
                                                <p className="text-[8px] text-gray-600 font-bold uppercase italic">Impression offset Heidelberg et couche d'effet {finish === 'foil' ? 'Holographique / Foil' : 'Standard'}...</p>
                                            </div>

                                            {/* Step 3: Shipped */}
                                            <div className="relative flex flex-col gap-1">
                                                <div className={`absolute -left-[27px] w-5 h-5 rounded-full border flex items-center justify-center text-[9px] ${trackerStatus === 'shipped' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,242,254,0.3)] animate-pulse' : trackerStatus === 'delivered' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-zinc-900 border-white/10 text-gray-600'}`}>
                                                    <Truck className="w-3 h-3" />
                                                </div>
                                                <p className={`text-[10px] font-black uppercase ${trackerStatus === 'shipped' ? 'text-neon-cyan' : trackerStatus === 'delivered' ? 'text-gray-400' : 'text-gray-600'}`}>Expédiée & Livraison</p>
                                                <p className="text-[8px] text-gray-600 font-bold uppercase italic">
                                                    Colis remis au transporteur (La Poste). Livraison sous {orderResult.estimatedDays === 10 ? '7-10' : '5-7'} jours.
                                                </p>
                                                {trackerStatus === 'shipped' && trackerTrackingUrl && (
                                                    <a
                                                        href={trackerTrackingUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-1 px-3 py-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan rounded-lg text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 w-fit transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        Suivre mon colis ({trackerTrackingNumber || 'La Poste'}) <ChevronRight className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation Footer */}
                    {step !== 'submitting' && (
                        <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                            {/* Left part */}
                            {step === 'finish' && (
                                <div className="text-[10px] font-bold text-gray-500 uppercase italic">
                                    Option sélectionnée : <span className={`font-black ${finish === 'foil' ? 'text-neon-red' : 'text-neon-cyan'}`}>{finish.toUpperCase()}</span>
                                </div>
                            )}

                            {step === 'preview' && (
                                <button
                                    onClick={() => setStep('finish')}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group"
                                >
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Finition
                                </button>
                            )}

                            {step === 'shipping' && (
                                <button
                                    onClick={() => setStep('preview')}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group"
                                >
                                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Aperçu HD
                                </button>
                            )}

                            {step === 'tracker' && (
                                <div className="text-[8px] text-gray-500 font-bold uppercase italic">
                                    {trackerStatus === 'shipped' ? 'Ta carte est sur la route !' : 'Production commencée...'}
                                </div>
                            )}

                            {/* Right part */}
                            {step === 'finish' && (
                                <button
                                    onClick={generateHDPreviews}
                                    disabled={isExporting}
                                    className="px-8 py-4 bg-gradient-to-r from-neon-red via-purple-600 to-neon-cyan hover:shadow-[0_0_20px_rgba(255,0,51,0.3)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isExporting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Exportation HD...
                                        </>
                                    ) : (
                                        <>
                                            Suivant <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}

                            {step === 'preview' && (
                                <button
                                    onClick={() => setStep('shipping')}
                                    className="px-8 py-4 bg-gradient-to-r from-neon-red via-purple-600 to-neon-cyan hover:shadow-[0_0_20px_rgba(255,0,51,0.3)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    Livraison <ChevronRight className="w-4 h-4" />
                                </button>
                            )}

                            {step === 'shipping' && (
                                <button
                                    onClick={() => {
                                        if (validateShipping()) {
                                            handlePlaceOrder();
                                        }
                                    }}
                                    className="px-8 py-4 bg-neon-green hover:bg-neon-green/90 shadow-[0_0_25px_rgba(57,255,20,0.2)] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    Confirmer & Payer <ArrowRight className="w-4 h-4" />
                                </button>
                            )}

                            {step === 'tracker' && (
                                <button
                                    onClick={onClose}
                                    className="px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                >
                                    Retour au Profil
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
