import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, Lock, ShieldCheck, Check, 
    ArrowRight, Star, Zap, CreditCard, 
    ChevronRight, X, Loader2, Sparkles,
    LayoutGrid, Phone, Palette, MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { jsPDF } from 'jspdf';
import QRCodeStyling from 'qr-code-styling';

interface ProProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
    features: string[];
    color: string;
}

const PRO_PRODUCTS: ProProduct[] = [
    {
        id: 'pro-media-kit',
        name: 'Pack Media Kit Pro',
        description: 'Génération de kit média personnalisé avec consultation stratégique et export haute résolution illimité.',
        price: 150,
        icon: <Palette className="w-8 h-8" />,
        features: ['Consultation 30min', 'Export PDF/PNG 4K', 'Modifications illimitées', 'Accès Prioritaire'],
        color: 'neon-red'
    },
    {
        id: 'pro-spotlight',
        name: 'Campagne Spotlight',
        description: 'Mise en avant maximale sur la home pendant 7 jours + boost social média dédié.',
        price: 290,
        icon: <Sparkles className="w-8 h-8" />,
        features: ['Home Banner 7j', 'Post Instagram Dédié', 'Story Pack (3 slides)', 'Ciblage Audience'],
        color: 'neon-purple'
    },
    {
        id: 'pro-data-control',
        name: 'Accès Data Control',
        description: 'Accès complet au dashboard analytique en temps réel pour suivre l\'impact de vos campagnes.',
        price: 90,
        icon: <LayoutGrid className="w-8 h-8" />,
        features: ['Stats Temps Réel', 'Rapports Hebdomadaires', 'Export CSV Data', 'Support Dédié'],
        color: 'neon-cyan'
    },
    {
        id: 'pro-direct-line',
        name: 'Ligne Directe Team',
        description: 'Un accès direct à notre équipe éditoriale pour des publications en urgence et du contenu sur-mesure.',
        price: 500,
        icon: <Phone className="w-8 h-8" />,
        features: ['Publication < 2h', 'Slack Privé', 'Contenu Exclusif', 'Disponibilité 24/7'],
        color: 'neon-orange'
    }
];

export function ProShop() {
    const { t } = useLanguage();
    const [accessCode, setAccessCode] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('pro_auth') === 'true');
    const [authError, setAuthError] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProProduct | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'success'>('details');
    const [paymentDestination, setPaymentDestination] = useState('');
    
    // Dynamic products from generator
    const [dynamicProducts, setDynamicProducts] = useState<ProProduct[]>([]);
    const qrRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (checkoutStep === 'success' && paymentDestination && qrRef.current) {
            const qrCode = new QRCodeStyling({
                width: 200,
                height: 200,
                type: 'svg',
                data: paymentDestination,
                dotsOptions: {
                    color: "#ff0033",
                    type: "rounded"
                },
                backgroundOptions: {
                    color: "transparent",
                },
                cornersSquareOptions: {
                    type: 'extra-rounded',
                    color: '#ff0033'
                },
                imageOptions: {
                    crossOrigin: 'anonymous',
                    margin: 5
                }
            });
            qrRef.current.innerHTML = '';
            qrCode.append(qrRef.current);
        }
    }, [checkoutStep, paymentDestination]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.pro_payment_destination) setPaymentDestination(data.pro_payment_destination);
                }
            } catch (e) {
                console.error('Failed to fetch settings', e);
            }
        };

        const loadDynamicItems = () => {
            const savedPrices = localStorage.getItem('dropsiders_prices');
            const savedPacks = localStorage.getItem('dropsiders_packs');
            
            const prices = savedPrices ? JSON.parse(savedPrices) : [];
            const packs = savedPacks ? JSON.parse(savedPacks) : [];

            const proItems: ProProduct[] = [];

            // Add Packs first
            packs.forEach((p: any) => {
                proItems.push({
                    id: p.id,
                    name: `Pack ${p.name}`,
                    description: `Formule de partenariat complète incluant ${p.items.length} services majeurs.`,
                    price: parseInt(p.price) || 0,
                    icon: <Zap className="w-8 h-8" />,
                    features: p.items,
                    color: p.featured ? 'neon-red' : 'neon-purple'
                });
            });

            // Add Individual Prices (not hidden)
            prices.filter((p: any) => !p.hidden).forEach((p: any) => {
                proItems.push({
                    id: p.id,
                    name: p.label,
                    description: `Service à l'unité : ${p.label}. Idéal pour un boost ponctuel.`,
                    price: parseInt(p.price) || 0,
                    icon: <Sparkles className="w-8 h-8" />,
                    features: ['Activation sous 24h', 'Rapport de perf', 'Support Dédié'],
                    color: 'neon-cyan'
                });
            });

            setDynamicProducts(proItems);
        };

        fetchSettings();
        loadDynamicItems();
    }, []);

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        // Default pro code: DROPSIDERSPRO2026
        if (accessCode.toUpperCase() === 'PRO' || accessCode.toUpperCase() === 'DROPSIDERSPRO') {
            setIsAuthorized(true);
            localStorage.setItem('pro_auth', 'true');
            setAuthError(false);
        } else {
            setAuthError(true);
            setTimeout(() => setAuthError(false), 2000);
        }
    };

    const startCheckout = (product: ProProduct) => {
        setSelectedProduct(product);
        setIsCheckingOut(true);
        setCheckoutStep('details');
    };

    const generateInvoicePDF = (company: string, email: string, product: ProProduct, invoiceId: string) => {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        // Styles & colors
        const neonRed = [255, 0, 51];
        
        // Background
        doc.setFillColor(5, 5, 5);
        doc.rect(0, 0, 210, 297, 'F');

        // Header Decoration
        doc.setDrawColor( neonRed[0], neonRed[1], neonRed[2] );
        doc.setLineWidth(1);
        doc.line(10, 10, 30, 10);
        
        // Brand
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('DROPSIDERS', 10, 25);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('PROFESSIONAL SERVICES • MEDIA GROUP', 10, 30);

        // Invoice Info
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('TICKET DE PAIEMENT & FACTURE', 10, 50);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`N° RÉFÉRENCE : ${invoiceId}`, 10, 56);
        doc.text(`DATE : ${new Date().toLocaleDateString('fr-FR')}`, 10, 61);

        // Client Info
        doc.setTextColor( neonRed[0], neonRed[1], neonRed[2] );
        doc.text('DESTINATAIRE', 120, 50);
        doc.setTextColor(255, 255, 255);
        doc.text(company.toUpperCase(), 120, 56);
        doc.text(email, 120, 61);

        // Table Header
        doc.setFillColor(20, 20, 20);
        doc.rect(10, 80, 190, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('DÉSIGNATION DU SERVICE', 15, 86);
        doc.text('PRIX UNITAIRE HT', 160, 86);

        // Table Content
        doc.setDrawColor(40, 40, 40);
        doc.line(10, 105, 200, 105);
        doc.setFontSize(10);
        doc.text(product.name.toUpperCase(), 15, 98);
        doc.text(`${product.price}€`, 160, 98);

        // Total
        doc.setFontSize(12);
        doc.text('TOTAL À RÉGLER (HT)', 120, 120);
        doc.setTextColor( neonRed[0], neonRed[1], neonRed[2] );
        doc.setFontSize(18);
        doc.text(`${product.price},00€`, 160, 120);

        // Payment Instructions
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text('INSTRUCTIONS DE RÈGLEMENT', 10, 150);
        doc.rect(10, 153, 190, 20, 'S');
        doc.text(paymentDestination || 'Virement Bancaire / Carte Bancaire', 15, 163);

        // Footer
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(7);
        doc.text('Dropsiders Media - SIRET : 88472910300012 - Paris, France', 105, 280, { align: 'center' });
        doc.text('Document généré numériquement - Valeur de ticket de confirmation', 105, 285, { align: 'center' });

        return doc.output('datauristring').split(',')[1]; // Base64 only
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckoutStep('payment');

        const companyInput = (e.currentTarget as any).querySelector('input[placeholder*="Sony"]');
        const emailInput = (e.currentTarget as any).querySelector('input[placeholder*="pro@domain.com"]');
        
        const company = companyInput?.value || 'Inconnu';
        const email = emailInput?.value || '';
        const invoiceNumber = `DS-${Date.now().toString().slice(-6)}`;

        let attachment = null;
        if (selectedProduct) {
            attachment = generateInvoicePDF(company, email, selectedProduct, invoiceNumber);
        }

        try {
            await fetch('/api/pro-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company,
                    email,
                    productName: selectedProduct?.name,
                    price: selectedProduct?.price,
                    invoiceNumber,
                    attachment
                })
            });
        } catch (e) {
            console.error('Failed to notify admin', e);
        }

        setTimeout(() => {
            setCheckoutStep('success');
        }, 2000);
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
                {/* Background Ambient */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-red/10 animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] bg-neon-cyan/10 animate-pulse" />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-neon-red/10 rounded-[2rem] border border-neon-red/20 flex items-center justify-center mx-auto mb-8 rotate-12">
                            <Lock className="w-10 h-10 text-neon-red" />
                        </div>
                        <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter mb-4">
                            Espace <span className="text-neon-red">Professionnel</span>
                        </h1>
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Accès Restreint • Partenaires Dropsiders</p>
                    </div>

                    <form onSubmit={handleAuth} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Code d'accès pro</label>
                            <input 
                                type="password" 
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="••••••••••••"
                                className={`w-full bg-black/50 border ${authError ? 'border-neon-red' : 'border-white/10'} rounded-2xl px-6 py-4 text-center font-bold tracking-[0.5em] focus:outline-none focus:border-neon-red transition-all`}
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest italic shadow-lg shadow-red-900/20 hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            Déverrouiller <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <Link to="/" className="mt-12 text-[10px] text-gray-600 hover:text-white font-black uppercase tracking-widest text-center block transition-colors">
                        Retour au site public
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 lg:p-24 font-sans selection:bg-neon-red selection:text-white">
            {/* Background Ambient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-red/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row items-end justify-between gap-8 mb-24">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="px-4 py-1.5 bg-neon-red text-white text-[9px] font-black rounded-full uppercase tracking-[0.3em]">Pro Exclusive</div>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <h1 className="text-6xl md:text-8xl font-display font-black uppercase italic tracking-tighter leading-[0.8] mb-6">
                            BOUTIQUE <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-800">PARTENAIRES.</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest max-w-xl">
                            Accédez à nos services premium conçus pour maximiser l'impact de votre marque sur l'écosystème Dropsiders.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-[#050505] bg-white/10 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Partner" />
                                </div>
                            ))}
                            <div className="w-12 h-12 rounded-full border-2 border-[#050505] bg-neon-red flex items-center justify-center text-[10px] font-black">+42</div>
                        </div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Rejoint par les meilleurs pros</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
                    {dynamicProducts.map((product) => (
                        <motion.div 
                            key={product.id}
                            whileHover={{ y: -10 }}
                            className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col hover:border-white/20 transition-all group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${product.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                            
                            <div className={`w-16 h-16 rounded-2xl bg-${product.color}/10 border border-${product.color}/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform text-${product.color}`}>
                                {product.icon}
                            </div>

                            <h3 className="text-2xl font-display font-black uppercase italic mb-4 tracking-tighter leading-none">{product.name}</h3>
                            <p className="text-gray-500 text-[11px] font-bold leading-relaxed mb-8 flex-1">
                                {product.description}
                            </p>

                            <div className="space-y-3 mb-10">
                                {product.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-red" />
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-end justify-between mt-auto pt-8 border-t border-white/5">
                                <div className="text-3xl font-display font-black italic">
                                    {product.price}<span className="text-sm text-gray-500 ml-1">€ HT</span>
                                </div>
                                <button 
                                    onClick={() => startCheckout(product)}
                                    className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-neon-red hover:text-white transition-all shadow-xl"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Info Section */}
                <section className="bg-white/5 border border-white/10 rounded-[4rem] p-16 md:p-24 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <ShieldCheck className="w-64 h-64" />
                    </div>
                    <div className="max-w-3xl relative z-10">
                        <h2 className="text-4xl md:text-5xl font-display font-black uppercase italic mb-8 tracking-tighter">
                            PAIEMENT <span className="text-neon-red">SÉCURISÉ</span> & IMMÉDIAT.
                        </h2>
                        <p className="text-gray-400 text-lg font-medium leading-relaxed mb-12">
                            Toutes les transactions sont chiffrées. Une fois le paiement validé, nos services s'activent instantanément ou une mise en relation avec notre équipe est établie sous 24h.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="flex flex-col gap-2">
                                <span className="text-2xl font-black italic">100%</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Sécurisé</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-2xl font-black italic">Fast</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Activation</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-2xl font-black italic">Pro</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Support 24/7</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-2xl font-black italic">2k+</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Partenaires</span>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="mt-32 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Dropsiders Pro Boutique © {new Date().getFullYear()}</p>
                    <div className="flex gap-8">
                        <Link to="/" className="text-[10px] font-black uppercase tracking-[0.5em] hover:text-white transition-colors">Website</Link>
                        <Link to="/admin" className="text-[10px] font-black uppercase tracking-[0.5em] hover:text-white transition-colors">Dashboard</Link>
                        <button 
                            onClick={() => {
                                localStorage.removeItem('pro_auth');
                                setIsAuthorized(false);
                            }}
                            className="text-[10px] font-black uppercase tracking-[0.5em] hover:text-neon-red transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </footer>
            </div>

            {/* Checkout Modal */}
            <AnimatePresence>
                {isCheckingOut && selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCheckingOut(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <button 
                                onClick={() => setIsCheckingOut(false)}
                                className="absolute top-8 right-8 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-all z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                                {/* Left Side - Product Info */}
                                <div className="md:col-span-2 bg-white/5 p-12 flex flex-col border-r border-white/10">
                                    <div className="w-12 h-12 rounded-xl bg-neon-red/10 border border-neon-red/20 flex items-center justify-center mb-8 text-neon-red">
                                        {selectedProduct.icon}
                                    </div>
                                    <h3 className="text-2xl font-display font-black uppercase italic mb-4 leading-none">{selectedProduct.name}</h3>
                                    <p className="text-gray-500 text-xs font-bold leading-relaxed mb-8 flex-1">
                                        {selectedProduct.description}
                                    </p>
                                    <div className="mt-auto">
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total à régler</div>
                                        <div className="text-4xl font-display font-black italic">
                                            {selectedProduct.price}<span className="text-sm text-gray-500 ml-1">€ HT</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Steps */}
                                <div className="md:col-span-3 p-12">
                                    {checkoutStep === 'details' && (
                                        <form onSubmit={handlePayment} className="space-y-8">
                                            <h4 className="text-xl font-display font-black uppercase italic tracking-tight">Coordonnées</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Nom de la structure</label>
                                                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-red outline-none" placeholder="Ex: Sony Music, Tomorrowland..." />
                                                </div>
                                                <div>
                                                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Email professionnel</label>
                                                    <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-red outline-none" placeholder="pro@domain.com" />
                                                </div>
                                            </div>
                                            <button 
                                                type="submit"
                                                className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest italic flex items-center justify-center gap-3 hover:bg-gray-200 transition-all"
                                            >
                                                Confirmer & Payer <CreditCard className="w-5 h-5" />
                                            </button>
                                        </form>
                                    )}

                                    {checkoutStep === 'payment' && (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                            <Loader2 className="w-12 h-12 text-neon-red animate-spin mb-6" />
                                            <h4 className="text-xl font-display font-black uppercase italic tracking-tight mb-2">Traitement en cours</h4>
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Ne fermez pas cette fenêtre...</p>
                                        </div>
                                    )}

                                    {checkoutStep === 'success' && (
                                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20 text-green-500">
                                                <Check className="w-10 h-10" />
                                            </div>
                                            <h4 className="text-3xl font-display font-black uppercase italic tracking-tight mb-4">Succès !</h4>
                                            <p className="text-gray-400 text-sm font-medium mb-6">
                                                Votre commande a été validée. 
                                            </p>
                                            
                                            {paymentDestination && (
                                                <div className="w-full flex flex-col md:flex-row gap-6 mb-8">
                                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                                                        <div className="text-[10px] font-black text-neon-red uppercase tracking-widest mb-2">Instructions de règlement</div>
                                                        {paymentDestination.startsWith('http') ? (
                                                            <a 
                                                                href={paymentDestination} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-3 w-full py-4 bg-neon-red text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-900/20"
                                                            >
                                                                Payer par Carte <CreditCard className="w-4 h-4" />
                                                            </a>
                                                        ) : (
                                                            <p className="text-white font-bold text-xs break-all selection:bg-neon-red leading-relaxed">
                                                                {paymentDestination}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="bg-white p-3 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/10">
                                                        <div ref={qrRef} className="w-[120px] h-[120px] flex items-center justify-center overflow-hidden" />
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-8">
                                                Un email de confirmation vient de vous être envoyé.
                                            </p>

                                            <button 
                                                onClick={() => setIsCheckingOut(false)}
                                                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                                            >
                                                Fermer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ProShop;
