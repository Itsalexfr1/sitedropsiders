import React from 'react';

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

interface PriceGridVisualProps {
    prices: PriceItem[];
    packs: PackItem[];
}

export function PriceGridVisual({ prices, packs }: PriceGridVisualProps) {
    return (
        <div 
            className="w-full max-w-[1000px] bg-[#050505] p-12 md:p-20 border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center mx-auto"
        >
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-neon-red/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 text-center mb-20">
                <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                    <span className="text-[10px] font-black tracking-[0.4em] text-neon-red uppercase">Dropsiders Media</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-black uppercase italic tracking-tighter leading-[0.8] mb-4">
                    OFFRES & <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-800">TARIFS.</span>
                </h1>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] italic">Grille Officielle {new Date().getFullYear()}</p>
            </div>

            {/* Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-20 relative z-10">
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
            <div className="w-full bg-white/5 border border-white/10 rounded-[4rem] p-8 md:p-16 relative z-10">
                <h3 className="text-2xl md:text-3xl font-display font-black uppercase mb-12 tracking-tight flex items-center gap-6">
                        <span className="w-12 h-px bg-neon-red"></span>
                        TARIFS À LA CARTE
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                    {prices.filter(p => !p.hidden).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between group border-b border-white/10 pb-6">
                            <div className="flex items-center gap-4">
                                <span className="text-neon-red font-black text-xs">#0{idx + 1}</span>
                                <span className="text-sm font-black uppercase tracking-wider text-white group-hover:text-neon-red transition-colors">{item.label}</span>
                            </div>
                            <div className="text-xl font-black italic">
                                {item.price}<span className="text-[10px] text-gray-600 ml-1">€</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
                <div className="text-left">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Contact Commercial</p>
                    <p className="text-xs font-bold text-white">pro@dropsiders.com</p>
                </div>
                <div className="text-center">
                    <p className="text-[7px] font-black text-gray-600 uppercase tracking-[0.4em] leading-relaxed">
                        TVA non applicable, art. 293 B du CGI<br />
                        Dropsiders © {new Date().getFullYear()} • Tous droits réservés
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Dernière mise à jour</p>
                    <p className="text-xs font-bold text-neon-red uppercase italic">{new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
