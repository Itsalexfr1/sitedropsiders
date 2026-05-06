import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Download, FileText, Image as ImageIcon, ArrowLeft, 
    Plus, Trash2, Save, Sparkles, Zap, Instagram, 
    Facebook, Mic, LayoutGrid, Check, RefreshCw
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { isSuperAdmin } from '../utils/auth';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface PriceItem {
    id: string;
    label: string;
    price: string;
    hidden?: boolean;
}

interface PackItem {
    id: string;
    name: string;
    price: string;
    items: string[];
    featured?: boolean;
}

const DEFAULT_PRICES: PriceItem[] = [
    { id: '1', label: 'Article Sponsorisé', price: '125' },
    { id: '2', label: 'Instagram Post (Feed)', price: '90' },
    { id: '3', label: 'Pack Stories (3 slides)', price: '45' },
    { id: '4', label: 'Vidéo TikTok / Reel', price: '110' },
    { id: '5', label: 'Mise en avant Agenda', price: '60' },
    { id: '6', label: 'Placement Newsletter', price: '75' }
];

const DEFAULT_PACKS: PackItem[] = [
    { id: 'p1', name: 'STARDUST', price: '90', items: ["1 Post Instagram", "1 Story Pack", "1 Mention News", "Relais Facebook"] },
    { id: 'p2', name: 'SPOTLIGHT', price: '180', items: ["1 Article Dédié", "1 Post Instagram", "1 Story Pack"], featured: true },
    { id: 'p3', name: 'PULSE', price: '320', items: ["1 Article Premium", "2 Posts Instagram", "3 Stories Pack", "Newsletter"] },
    { id: 'p4', name: 'IMMERSIVE', price: '700', items: ["1 Post Instagram", "1 Story Pack", "Couverture Live", "Récap Vidéo (Team)"] }
];

export function AdminTarifs() {
    const [currentUser] = useState(localStorage.getItem('admin_user')?.toLowerCase() || '');
    const gridRef = useRef<HTMLDivElement>(null);
    const [prices, setPrices] = useState<PriceItem[]>(() => {
        const saved = localStorage.getItem('dropsiders_prices');
        return saved ? JSON.parse(saved) : DEFAULT_PRICES;
    });
    const [packs, setPacks] = useState<PackItem[]>(() => {
        const saved = localStorage.getItem('dropsiders_packs');
        return saved ? JSON.parse(saved) : DEFAULT_PACKS;
    });
    const [activeTab, setActiveTab] = useState<'individual' | 'packs'>('individual');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Save to localStorage when changed
    useEffect(() => {
        localStorage.setItem('dropsiders_prices', JSON.stringify(prices));
    }, [prices]);

    useEffect(() => {
        localStorage.setItem('dropsiders_packs', JSON.stringify(packs));
    }, [packs]);

    // Security Check
    if (!isSuperAdmin(currentUser)) {
        return <Navigate to="/admin" replace />;
    }

    const handleDownloadPng = async () => {
        if (!gridRef.current) return;
        setIsGenerating(true);
        try {
            // Temporary reset scale for clean capture
            const originalTransform = gridRef.current.style.transform;
            gridRef.current.style.transform = 'none';
            
            const dataUrl = await toPng(gridRef.current, {
                quality: 1,
                pixelRatio: 3,
                backgroundColor: '#050505',
                style: {
                    borderRadius: '0',
                    margin: '0',
                }
            });
            
            gridRef.current.style.transform = originalTransform;

            const link = document.createElement('a');
            link.download = `Dropsiders_Tarifs_${new Date().getFullYear()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate PNG', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!gridRef.current) return;
        setIsGenerating(true);
        try {
            // Temporary reset scale for clean capture
            const originalTransform = gridRef.current.style.transform;
            gridRef.current.style.transform = 'none';

            const dataUrl = await toPng(gridRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#050505',
                style: {
                    borderRadius: '0',
                    margin: '0',
                }
            });
            
            gridRef.current.style.transform = originalTransform;

            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => (img.onload = resolve));
            
            // Calculate dynamic height to maintain aspect ratio without white borders
            const pdfWidth = 210;
            const pdfHeight = (img.height * pdfWidth) / img.width;
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`Dropsiders_Tarifs_${new Date().getFullYear()}.pdf`);
        } catch (err) {
            console.error('Failed to generate PDF', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const updatePrice = (id: string, field: keyof PriceItem, value: any) => {
        setPrices(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const addPrice = () => {
        const newPrice: PriceItem = {
            id: Date.now().toString(),
            label: 'Nouveau Tarif',
            price: '0',
            hidden: false
        };
        setPrices(prev => [...prev, newPrice]);
    };

    const removePrice = (id: string) => {
        setPrices(prev => prev.filter(p => p.id !== id));
    };

    const updatePack = (id: string, field: keyof PackItem, value: any) => {
        setPacks(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const addPackItem = (packId: string) => {
        setPacks(prev => prev.map(p => {
            if (p.id === packId) {
                return { ...p, items: [...p.items, "Nouveau service"] };
            }
            return p;
        }));
    };

    const removePackItem = (packId: string, itemIndex: number) => {
        setPacks(prev => prev.map(p => {
            if (p.id === packId) {
                const newItems = [...p.items];
                newItems.splice(itemIndex, 1);
                return { ...p, items: newItems };
            }
            return p;
        }));
    };

    const updatePackItem = (packId: string, itemIndex: number, value: string) => {
        setPacks(prev => prev.map(p => {
            if (p.id === packId) {
                const newItems = [...p.items];
                newItems[itemIndex] = value;
                return { ...p, items: newItems };
            }
            return p;
        }));
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-display font-black uppercase italic tracking-tighter flex items-center gap-3">
                                Générateur de <span className="text-neon-red">Tarifs</span>
                            </h1>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Media Kit Creator • SuperAdmin Only</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handleDownloadPng}
                            disabled={isGenerating}
                            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            Exporter PNG
                        </button>
                        <button 
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            className="px-8 py-4 bg-neon-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-3 shadow-lg shadow-red-900/20 disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            Générer PDF
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Editor Side */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Tabs Navigation */}
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                            <button 
                                onClick={() => setActiveTab('individual')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'individual' ? 'bg-neon-red text-white shadow-lg shadow-red-900/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                Tarifs Individuels
                            </button>
                            <button 
                                onClick={() => setActiveTab('packs')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'packs' ? 'bg-neon-red text-white shadow-lg shadow-red-900/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                Formules Packs
                            </button>
                        </div>

                        {activeTab === 'individual' ? (
                            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest text-neon-red mb-8 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Tarifs Individuels
                            </h3>
                            <div className="space-y-6">
                                {prices.map(p => (
                                    <div key={p.id} className={`p-4 rounded-2xl border transition-all ${p.hidden ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => updatePrice(p.id, 'hidden', !p.hidden)}
                                                    className={`p-2 rounded-lg transition-all ${p.hidden ? 'bg-gray-500/20 text-gray-500' : 'bg-neon-cyan/20 text-neon-cyan'}`}
                                                    title={p.hidden ? "Afficher sur la grille" : "Masquer sur la grille"}
                                                >
                                                    {p.hidden ? <LayoutGrid className="w-3.5 h-3.5 opacity-50" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                </button>
                                                <button 
                                                    onClick={() => removePrice(p.id)}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Tarif #{p.id.slice(-4)}</span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Label du service</label>
                                                <input 
                                                    type="text" 
                                                    value={p.label}
                                                    onChange={(e) => updatePrice(p.id, 'label', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-red transition-all"
                                                    placeholder="Nom du service..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Prix</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={p.price}
                                                        onChange={(e) => updatePrice(p.id, 'price', e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-red transition-all"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">€ HT</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button 
                                    onClick={addPrice}
                                    className="w-full py-4 bg-white/5 border border-dashed border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                >
                                    <Plus className="w-4 h-4" /> Ajouter un tarif
                                </button>
                            </div>
                        </section>
                        ) : (
                        <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                            <h3 className="text-sm font-black uppercase tracking-widest text-neon-red mb-8 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Formules de Partenariat
                            </h3>
                            <div className="space-y-6">
                                {packs.map(pkg => (
                                    <div key={pkg.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Nom du Pack</label>
                                                <input 
                                                    value={pkg.name} 
                                                    onChange={(e) => updatePack(pkg.id, 'name', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest italic"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Prix (€)</label>
                                                <input 
                                                    value={pkg.price} 
                                                    onChange={(e) => updatePack(pkg.id, 'price', e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Inclusions du pack</label>
                                            <div className="space-y-2">
                                                {pkg.items.map((item, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input 
                                                            value={item} 
                                                            onChange={(e) => updatePackItem(pkg.id, idx, e.target.value)}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-medium focus:border-neon-red focus:outline-none transition-all"
                                                            placeholder="Ex: 1 Post Instagram..."
                                                        />
                                                        <button 
                                                            onClick={() => removePackItem(pkg.id, idx)}
                                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => addPackItem(pkg.id)}
                                                    className="w-full py-2 bg-white/5 border border-dashed border-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/40 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-3 h-3" /> Ajouter une ligne
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => updatePack(pkg.id, 'featured', !pkg.featured)}
                                            className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${pkg.featured ? 'bg-neon-red text-white' : 'bg-white/5 text-gray-500'}`}
                                        >
                                            {pkg.featured ? 'Pack Mis en Avant' : 'Mettre en Avant'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                        )}
                    </div>

                    {/* Preview Side */}
                    <div className="lg:col-span-7">
                        <div className="sticky top-12 space-y-6">
                            <div className="flex items-center justify-between px-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 italic">Aperçu du Rendu Final</h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse delay-75" />
                                </div>
                            </div>
                            
                            {/* THE ACTUAL GRID TO CAPTURE */}
                            <div 
                                ref={gridRef}
                                className="w-[1000px] bg-[#050505] p-12 md:p-20 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center shrink-0 origin-top"
                                style={{ transform: 'scale(0.65)', marginBottom: '-450px', minHeight: '1414px' }}
                            >
                                {/* Background Decorations for PNG/PDF */}
                                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                                <div className="absolute -top-24 -left-24 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px] pointer-events-none" />
                                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />

                                {/* Header */}
                                <div className="relative z-10 text-center mb-20">
                                    <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                                        <span className="text-[10px] font-black tracking-[0.4em] text-neon-red uppercase">Dropsiders Media</span>
                                    </div>
                                    <h1 className="text-7xl font-display font-black uppercase italic tracking-tighter leading-[0.8] mb-4">
                                        OFFRES & <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-800">TARIFS.</span>
                                    </h1>
                                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.5em] italic">Grille Officielle {new Date().getFullYear()}</p>
                                </div>

                                {/* Packs Grid */}
                                <div className="grid grid-cols-2 gap-6 w-full mb-20 relative z-10">
                                    {packs.map((pkg, i) => (
                                        <div 
                                            key={i} 
                                            className={`p-10 rounded-[3rem] border ${pkg.featured ? 'bg-white/10 border-neon-red shadow-[0_0_50px_rgba(255,51,51,0.1)]' : 'bg-white/5 border-white/10'} relative overflow-hidden`}
                                        >
                                            {pkg.featured && (
                                                <div className="absolute top-6 right-6 px-4 py-1.5 bg-neon-red text-white text-[9px] font-black rounded-full uppercase tracking-widest">Recommandé</div>
                                            )}
                                            <h3 className="text-2xl font-display font-black mb-1 italic tracking-tighter uppercase">{pkg.name}</h3>
                                            <div className="text-5xl font-black mb-8 flex items-baseline gap-1">
                                                {pkg.price}<span className="text-sm text-gray-500 font-bold uppercase tracking-widest">€ HT</span>
                                            </div>
                                            <ul className="space-y-4">
                                                {pkg.items.map((item, idx) => (
                                                    <li key={idx} className="flex items-center gap-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                        <div className="w-1.5 h-1.5 bg-neon-red rounded-full" /> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                {/* A La Carte */}
                                <div className="w-full bg-white/5 border border-white/10 rounded-[4rem] p-16 relative z-10">
                                    <h3 className="text-3xl font-display font-black uppercase mb-12 tracking-tight flex items-center gap-6">
                                         <span className="w-12 h-px bg-neon-red"></span>
                                         TARIFS À LA CARTE
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-16 gap-y-10">
                                        {prices.filter(p => !p.hidden).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between group border-b border-white/10 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_10px_red]" />
                                                    <span className="text-sm font-black uppercase tracking-widest text-gray-300">{item.label}</span>
                                                </div>
                                                <span className="text-xl font-display font-black text-white italic">{item.price}€</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-32 pt-12 border-t border-white/10 w-full flex justify-between items-center opacity-40">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Dropsiders Media Group © 2026</p>
                                    <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em]">Confidential Business Document</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminTarifs;
