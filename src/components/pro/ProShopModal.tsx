import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, Lock, ArrowRight, Zap, Sparkles, 
    Star, Instagram, Clock, Phone, LayoutGrid,
    Check, Image, FileText, ExternalLink, Loader2,
    X, LayoutPanelLeft, CreditCard, ArrowLeft, History
} from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { PriceGridVisual } from './PriceGridVisual';

interface ProProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
    features: string[];
    color: string;
}

interface ProShopModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_PRO_PRODUCTS: ProProduct[] = [
    {
        id: 'p1',
        name: 'Pack STARDUST',
        description: 'Solution d\'entrée de gamme pour une visibilité efficace sur nos réseaux.',
        price: 80,
        icon: <Zap className="w-8 h-8" />,
        features: ["1 POST INSTAGRAM", "1 STORY", "AJOUT DANS L'AGENDA"],
        color: 'neon-cyan'
    },
    {
        id: 'p2',
        name: 'Pack SPOTLIGHT',
        description: 'La formule recommandée pour une mise en avant éditoriale et sociale complète.',
        price: 150,
        icon: <Sparkles className="w-8 h-8" />,
        features: ["1 ARTICLE DÉDIÉ", "1 POST INSTAGRAM", "2 STORY", "AJOUT DANS L'AGENDA"],
        color: 'neon-red'
    },
    {
        id: 'p3',
        name: 'Pack PULSE',
        description: 'Visibilité intensive incluant du contenu vidéo court (Réels).',
        price: 200,
        icon: <Zap className="w-8 h-8" />,
        features: ["2 POSTS INSTAGRAM", "3 STORIES", "1 RÉEL", "AJOUT DANS L'AGENDA"],
        color: 'neon-purple'
    },
    {
        id: 'p4',
        name: 'Pack IMMERSIVE',
        description: 'L\'expérience ultime pour une couverture totale sur tous nos supports.',
        price: 350,
        icon: <Star className="w-8 h-8" />,
        features: ["1 ARTICLE", "3 POST INSTAGRAM", "5 STORY", "3 RÉELS", "AJOUT DANS L'AGENDA"],
        color: 'neon-orange'
    }
];

export function ProShopModal({ isOpen, onClose }: ProShopModalProps) {
    const [isAuthorized, setIsAuthorized] = useState(localStorage.getItem('pro_auth') === 'true');
    const [accessCode, setAccessCode] = useState('');
    const [authError, setAuthError] = useState(false);
    const [activeTab, setActiveTab] = useState<'catalog' | 'grid' | 'archive' | 'config'>('catalog');
    const [dynamicProducts, setDynamicProducts] = useState<ProProduct[]>(DEFAULT_PRO_PRODUCTS);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    
    // Checkout states
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProProduct | null>(null);
    const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment_choice' | 'payment' | 'success'>('details');
    
    // Form states
    const [checkoutCompany, setCheckoutCompany] = useState('');
    const [checkoutEmail, setCheckoutEmail] = useState('');
    const [checkoutDetails, setCheckoutDetails] = useState('');
    const [checkoutDriveLink, setCheckoutDriveLink] = useState('');
    const [checkoutPressKit, setCheckoutPressKit] = useState('');
    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [hasOpenedPaymentLink, setHasOpenedPaymentLink] = useState(false);

    // Config states
    const [configData, setConfigData] = useState({
        accessCode: 'DROPSIDERSPRO',
        paymentDestination: 'https://bunq.me/itsalexalex01',
        displayMode: 'HT'
    });
    const [orders, setOrders] = useState<any[]>([]);
    const [paymentDestination, setPaymentDestination] = useState('https://bunq.me/itsalexalex01');
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const user = localStorage.getItem('admin_user')?.toLowerCase();
        setIsSuperAdmin(user === 'alex' || user === 'alexfr' || user === 'admin');
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadDynamicItems();
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                const finalPayment = data.paymentDestination || data.pro_payment_destination || 'https://bunq.me/itsalexalex01';
                const finalCode = data.accessCode || data.pro_access_code || 'DROPSIDERSPRO';

                setPaymentDestination(finalPayment);
                setConfigData(prev => ({
                    ...prev,
                    accessCode: finalCode,
                    paymentDestination: finalPayment
                }));
            }
            const ordersRes = await fetch('/api/pro-orders');
            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData);
            }
        } catch (e) {
            console.error('Failed to fetch settings', e);
        }
    };

    const loadDynamicItems = () => {
        const savedPrices = localStorage.getItem('dropsiders_prices');
        const savedPacks = localStorage.getItem('dropsiders_packs');
        
        if (!savedPrices && !savedPacks) {
            const initialItems = [...DEFAULT_PRO_PRODUCTS];
            const individuals = [
                { id: '1', name: 'ARTICLE SUR LE SITE', price: 100, color: 'neon-cyan', icon: <Sparkles className="w-8 h-8" /> },
                { id: '2', name: 'POST INSTAGRAM', price: 50, color: 'neon-purple', icon: <Instagram className="w-8 h-8" /> },
                { id: '3', name: 'INSTAGRAM STORY', price: 30, color: 'neon-red', icon: <Zap className="w-8 h-8" /> },
                { id: '4', name: 'PACK 1 STORY + 1 POST', price: 70, color: 'neon-orange', icon: <LayoutGrid className="w-8 h-8" /> },
                { id: '5', name: "AJOUT DANS L'AGENDA", price: 30, color: 'neon-green', icon: <Clock className="w-8 h-8" /> },
                { id: '6', name: 'RÉEL INSTAGRAM + TIKTOK', price: 100, color: 'neon-blue', icon: <Phone className="w-8 h-8" /> }
            ];

            individuals.forEach(item => {
                initialItems.push({
                    ...item,
                    description: `Service à l'unité : ${item.name}. Idéal pour un boost ponctuel.`,
                    features: ['Activation sous 24h', 'Rapport de perf', 'Support Dédié']
                } as ProProduct);
            });

            setDynamicProducts(initialItems);
            return;
        }

        const prices = savedPrices ? JSON.parse(savedPrices) : [];
        const packs = savedPacks ? JSON.parse(savedPacks) : [];
        const proItems: ProProduct[] = [];

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

        const palette = ['neon-cyan', 'neon-purple', 'neon-red', 'neon-orange', 'neon-green', 'neon-blue'];
        prices.filter((p: any) => !p.hidden).forEach((p: any, idx: number) => {
            proItems.push({
                id: p.id,
                name: p.label,
                description: `Service à l'unité : ${p.label}. Idéal pour un boost ponctuel.`,
                price: parseInt(p.price) || 0,
                icon: <Sparkles className="w-8 h-8" />,
                features: ['Activation sous 24h', 'Rapport de perf', 'Support Dédié'],
                color: palette[idx % palette.length]
            });
        });

        setDynamicProducts(proItems);
    };

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessCode.toUpperCase() === configData.accessCode.toUpperCase() || accessCode.toUpperCase() === 'DROPSIDERSPRO') {
            setIsAuthorized(true);
            setAuthError(false);
            localStorage.setItem('pro_auth', 'true');
        } else {
            setAuthError(true);
        }
    };

    const startCheckout = (product: ProProduct) => {
        setSelectedProduct(product);
        setIsCheckingOut(true);
        setCheckoutStep('details');
        setHasOpenedPaymentLink(false);
        setPaymentProof(null);
    };

    const handleConfirmDetails = (e: React.FormEvent) => {
        e.preventDefault();
        setCheckoutStep('payment_choice');
    };

    const handlePayment = async () => {
        setCheckoutStep('payment');
        
        const orderData = {
            id: `PRO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            date: new Date().toISOString(),
            product: selectedProduct?.name,
            price: selectedProduct?.price,
            company: checkoutCompany,
            email: checkoutEmail,
            details: checkoutDetails,
            drive: checkoutDriveLink,
            presskit: checkoutPressKit,
            status: 'pending_payment',
            paymentProof: paymentProof
        };

        try {
            await fetch('/api/pro-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            setOrders(prev => [orderData, ...prev]);
            setTimeout(() => setCheckoutStep('success'), 2000);
        } catch (e) {
            console.error('Failed to submit order', e);
            setCheckoutStep('payment_choice');
        }
    };

    const getDynamicPaymentLink = (baseUrl: string, price: number) => {
        if (!baseUrl || !baseUrl.startsWith('http')) return baseUrl;
        try {
            const url = new URL(baseUrl);
            const host = url.hostname.toLowerCase();
            if (host.includes('bunq.me')) {
                const parts = url.pathname.split('/').filter(p => p);
                return `https://bunq.me/${parts[0]}/${price}`;
            }
            if (host.includes('paypal.me')) {
                const parts = url.pathname.split('/').filter(p => p);
                return `https://paypal.me/${parts[0]}/${price}`;
            }
            return baseUrl;
        } catch (e) { return baseUrl; }
    };

    useEffect(() => {
        if (checkoutStep === 'payment_choice' && qrRef.current && paymentDestination && !paymentDestination.startsWith('http')) {
            const qrCode = new QRCodeStyling({
                width: 120,
                height: 120,
                data: getDynamicPaymentLink(paymentDestination, selectedProduct?.price || 0),
                dotsOptions: { color: "#ff0033", type: "rounded" },
                backgroundOptions: { color: "#ffffff" },
                cornersSquareOptions: { type: "extra-rounded" }
            });
            qrRef.current.innerHTML = '';
            qrCode.append(qrRef.current);
        }
    }, [checkoutStep, paymentDestination, selectedProduct]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-6xl h-[90vh] bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-neon-red/10 rounded-2xl flex items-center justify-center border border-neon-red/20 rotate-12">
                                <Lock className="w-6 h-6 text-neon-red" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter">Espace <span className="text-neon-red">Pro</span></h2>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Partenaires & Professionnels</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {isAuthorized && (
                                <nav className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setActiveTab('catalog')}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalog' ? 'bg-neon-red text-white' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Packs
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('grid')}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'grid' ? 'bg-neon-red text-white' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Grille
                                    </button>
                                    {isSuperAdmin && (
                                        <>
                                            <button 
                                                onClick={() => setActiveTab('archive')}
                                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'archive' ? 'bg-neon-red text-white' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Archive
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('config')}
                                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-neon-red text-white' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                Config
                                            </button>
                                        </>
                                    )}
                                </nav>
                            )}
                            <button 
                                onClick={onClose}
                                className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-500 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {!isAuthorized ? (
                            <div className="h-full flex items-center justify-center">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-sm text-center"
                                >
                                    <h3 className="text-2xl font-display font-black uppercase italic mb-8">Accès <span className="text-neon-red">Sécurisé</span></h3>
                                    <form onSubmit={handleAuth} className="space-y-6">
                                        <input 
                                            type="password" 
                                            value={accessCode}
                                            onChange={(e) => setAccessCode(e.target.value)}
                                            placeholder="Code d'accès pro"
                                            className={`w-full bg-white/5 border ${authError ? 'border-neon-red' : 'border-white/10'} rounded-2xl px-6 py-4 text-center font-bold tracking-[0.5em] outline-none focus:border-neon-red transition-all`}
                                        />
                                        <button 
                                            type="submit"
                                            className="w-full py-5 bg-neon-red text-white rounded-2xl font-black uppercase tracking-widest italic shadow-xl shadow-red-900/20"
                                        >
                                            Déverrouiller
                                        </button>
                                    </form>
                                </motion.div>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {activeTab === 'catalog' && (
                                    <motion.div 
                                        key="catalog"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                    >
                                        {dynamicProducts.map((product) => (
                                            <div 
                                                key={product.id}
                                                className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col group relative overflow-hidden"
                                            >
                                                <div className={`w-14 h-14 rounded-2xl bg-${product.color}/10 border border-${product.color}/20 flex items-center justify-center mb-6 text-${product.color}`}>
                                                    {product.icon}
                                                </div>
                                                <h3 className="text-xl font-display font-black uppercase italic mb-4">{product.name}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 flex-1 leading-relaxed">{product.description}</p>
                                                <div className="space-y-2 mb-8">
                                                    {product.features.map((f, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-400">
                                                            <div className={`w-1 h-1 rounded-full bg-${product.color}`} /> {f}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                    <span className="text-2xl font-display font-black italic">{product.price}€</span>
                                                    <button 
                                                        onClick={() => startCheckout(product)}
                                                        className={`px-6 py-3 bg-${product.color} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg`}
                                                    >
                                                        Commander
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'grid' && (
                                    <motion.div 
                                        key="grid"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="py-10"
                                    >
                                        <PriceGridVisual 
                                            prices={JSON.parse(localStorage.getItem('dropsiders_prices') || '[]')}
                                            packs={JSON.parse(localStorage.getItem('dropsiders_packs') || '[]')}
                                        />
                                    </motion.div>
                                )}

                                {activeTab === 'archive' && (
                                    <motion.div 
                                        key="archive"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        {orders.length === 0 ? (
                                            <div className="text-center py-20 text-gray-600 uppercase font-black tracking-widest text-xs">Aucune commande archivée</div>
                                        ) : (
                                            orders.map((order, idx) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-neon-red font-black text-xs">{order.id}</span>
                                                            <span className="text-gray-500 text-[10px] font-bold">{new Date(order.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <h4 className="text-lg font-black uppercase">{order.product}</h4>
                                                        <p className="text-xs text-gray-400 font-bold">{order.company} • {order.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {order.paymentProof && (
                                                            <a href={order.paymentProof} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[9px] font-black uppercase">Preuve</a>
                                                        )}
                                                        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${order.status === 'completed' ? 'bg-green-500 text-white' : 'bg-orange-500/10 text-orange-500'}`}>
                                                            {order.status === 'completed' ? 'Validé' : 'En attente'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'config' && (
                                    <motion.div 
                                        key="config"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                    >
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 space-y-6">
                                            <h3 className="text-xl font-display font-black uppercase italic flex items-center gap-3"><CreditCard className="w-5 h-5 text-neon-red" /> Paiement Pro</h3>
                                            <textarea 
                                                value={configData.paymentDestination}
                                                onChange={(e) => setConfigData({ ...configData, paymentDestination: e.target.value })}
                                                className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-neon-red"
                                            />
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 space-y-6">
                                            <h3 className="text-xl font-display font-black uppercase italic flex items-center gap-3"><Lock className="w-5 h-5 text-neon-cyan" /> Accès Pro</h3>
                                            <input 
                                                type="text"
                                                value={configData.accessCode}
                                                onChange={(e) => setConfigData({ ...configData, accessCode: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-neon-red"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between shrink-0">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">Dropsiders Pro Boutique © {new Date().getFullYear()}</p>
                        <div className="flex gap-4">
                            <button onClick={() => { localStorage.removeItem('pro_auth'); setIsAuthorized(false); }} className="text-[9px] font-black text-gray-500 uppercase hover:text-neon-red transition-colors">Déconnexion Pro</button>
                        </div>
                    </div>

                    {/* Checkout Overlays */}
                    <AnimatePresence>
                        {isCheckingOut && selectedProduct && (
                            <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckingOut(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 flex flex-col max-h-[90vh] overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-xl font-display font-black uppercase italic">Paiement <span className="text-neon-red">Sécurisé</span></h4>
                                        <button onClick={() => setIsCheckingOut(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {checkoutStep === 'details' && (
                                            <form onSubmit={handleConfirmDetails} className="space-y-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Structure</label>
                                                        <input required value={checkoutCompany} onChange={e => setCheckoutCompany(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-neon-red" placeholder="Nom de votre entité" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Email Pro</label>
                                                        <input required type="email" value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-neon-red" placeholder="pro@domain.com" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Détails de la demande</label>
                                                        <textarea value={checkoutDetails} onChange={e => setCheckoutDetails(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-neon-red h-24" placeholder="Dates, description..." />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Lien Drive / Photos</label>
                                                            <input value={checkoutDriveLink} onChange={e => setCheckoutDriveLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-neon-red" placeholder="Lien Google Drive, WeTransfer..." />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Press Kit / Dropbox</label>
                                                            <input value={checkoutPressKit} onChange={e => setCheckoutPressKit(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-neon-red" placeholder="Lien Dropbox, Site Web..." />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button type="submit" className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest italic flex items-center justify-center gap-2">Suivant <ArrowRight className="w-5 h-5" /></button>
                                            </form>
                                        )}
                                        
                                        {checkoutStep === 'payment_choice' && (
                                            <div className="space-y-6">
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                                    <p className="text-[10px] font-black text-neon-red uppercase tracking-widest mb-4">Moyen de paiement</p>
                                                    {paymentDestination.startsWith('http') ? (
                                                        <div className="space-y-4">
                                                            {!hasOpenedPaymentLink ? (
                                                                <a href={getDynamicPaymentLink(paymentDestination, selectedProduct.price)} target="_blank" rel="noreferrer" onClick={() => setHasOpenedPaymentLink(true)} className="flex items-center justify-center gap-3 w-full py-4 bg-neon-red text-white rounded-xl font-black uppercase text-[10px]">Lien de paiement <CreditCard className="w-4 h-4" /></a>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Preuve de paiement (BUNQ/Capture)</label>
                                                                        <input type="file" onChange={e => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const reader = new FileReader();
                                                                                reader.onloadend = () => setPaymentProof(reader.result as string);
                                                                                reader.readAsDataURL(file);
                                                                            }
                                                                        }} className="w-full text-[10px] file:bg-white/10 file:border-none file:text-white file:px-4 file:py-2 file:rounded-lg file:mr-4" />
                                                                    </div>
                                                                    <button disabled={!paymentProof} onClick={handlePayment} className="w-full py-4 bg-green-500 text-white rounded-xl font-black uppercase text-[10px] disabled:opacity-30">Valider mon paiement</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <p className="text-[10px] text-white font-bold break-all">{paymentDestination}</p>
                                                            <div className="bg-white p-3 rounded-2xl inline-block mx-auto" ref={qrRef} />
                                                            <button onClick={handlePayment} className="w-full py-4 bg-neon-red text-white rounded-xl font-black uppercase text-[10px]">Confirmer ma commande</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => setCheckoutStep('details')} className="w-full text-[8px] font-black text-gray-600 uppercase text-center">Retour</button>
                                            </div>
                                        )}

                                        {checkoutStep === 'payment' && <div className="flex flex-col items-center py-20"><Loader2 className="w-10 h-10 text-neon-red animate-spin mb-4" /><p className="text-[10px] font-black uppercase text-gray-500">Traitement en cours...</p></div>}
                                        {checkoutStep === 'success' && <div className="text-center py-12"><div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500"><Check className="w-8 h-8" /></div><h4 className="text-2xl font-display font-black uppercase italic mb-4">Commande Reçue</h4><p className="text-gray-400 text-xs font-bold leading-relaxed mb-8">Nous reviendrons vers vous par email très prochainement.</p><button onClick={() => setIsCheckingOut(false)} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase">Fermer</button></div>}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
