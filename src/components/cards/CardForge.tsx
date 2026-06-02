import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import type { DropsidersCard } from '../../context/UserContext';
import { DropsidersCardComponent } from './DropsidersCard';

const CRAFTING_RULES = {
    common: { required: 5, next: 'rare' as const, label: '5 Communes ➔ 1 Rare' },
    rare: { required: 4, next: 'epic' as const, label: '4 Rares ➔ 1 Épique' },
    epic: { required: 3, next: 'legendary' as const, label: '3 Épiques ➔ 1 Légendaire' }
};

type RarityKeys = keyof typeof CRAFTING_RULES;

export function CardForge() {
    const { collectedCards, burnCards, craftCard, showNotification } = useUser();
    const [selectedRarity, setSelectedRarity] = useState<RarityKeys>('common');
    const [selectedCards, setSelectedCards] = useState<DropsidersCard[]>([]);
    const [isCrafting, setIsCrafting] = useState(false);
    const [craftedCard, setCraftedCard] = useState<DropsidersCard | null>(null);

    const availableCards = collectedCards.filter(c => c.rarity === selectedRarity);
    const rule = CRAFTING_RULES[selectedRarity];

    const handleSelectCard = (card: DropsidersCard) => {
        if (selectedCards.find(c => c.id === card.id)) {
            setSelectedCards(selectedCards.filter(c => c.id !== card.id));
        } else if (selectedCards.length < rule.required) {
            setSelectedCards([...selectedCards, card]);
        }
    };

    const handleCraft = () => {
        if (selectedCards.length !== rule.required) return;
        
        setIsCrafting(true);
        
        // Simulate forging animation time
        setTimeout(() => {
            burnCards(selectedCards.map(c => c.id));
            const newCard = craftCard(rule.next);
            
            if (newCard) {
                setCraftedCard(newCard);
                showNotification(`Fusion réussie ! Vous avez obtenu une carte ${rule.next}.`, 'success');
            } else {
                showNotification(`Erreur lors de la fusion.`, 'error');
            }
            
            setSelectedCards([]);
            setIsCrafting(false);
        }, 3000); // 3 seconds forge animation
    };

    const resetForge = () => {
        setCraftedCard(null);
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] pointer-events-none rounded-full" />

            <div className="text-center mb-8 relative z-10">
                <h2 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500 mb-2">
                    La Forge
                </h2>
                <p className="text-white/60">Sacrifiez vos cartes en double pour invoquer des cartes de rareté supérieure.</p>
            </div>

            {craftedCard ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 relative z-10"
                >
                    <h3 className="text-2xl font-bold text-white mb-8">✨ Nouvelle Carte Invoquée ! ✨</h3>
                    <div className="animate-float">
                        <DropsidersCardComponent card={craftedCard} scale={1.2} flippable />
                    </div>
                    <button 
                        onClick={resetForge}
                        className="mt-12 px-8 py-3 bg-white text-black font-bold uppercase tracking-wider rounded-full hover:bg-orange-400 hover:text-white transition-colors"
                    >
                        Forger à nouveau
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    
                    {/* Left Panel: Inventory & Selection */}
                    <div className="col-span-2 flex flex-col h-[600px] border border-white/5 bg-black/40 rounded-xl p-4 backdrop-blur-md">
                        {/* Rarity Tabs */}
                        <div className="flex gap-2 mb-4 p-1 bg-white/5 rounded-lg w-fit">
                            {(Object.keys(CRAFTING_RULES) as RarityKeys[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => { setSelectedRarity(r); setSelectedCards([]); }}
                                    className={`px-4 py-2 text-sm font-bold uppercase rounded-md transition-all ${
                                        selectedRarity === r ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'text-white/40 hover:text-white/80'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <p className="text-xs text-white/50 mb-4 uppercase tracking-widest">{rule.label}</p>

                        {/* Cards Grid */}
                        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 sm:grid-cols-4 gap-4 pb-4">
                            {availableCards.length === 0 ? (
                                <p className="col-span-full text-center text-white/30 mt-10">Aucune carte {selectedRarity} disponible.</p>
                            ) : (
                                availableCards.map(card => {
                                    const isSelected = selectedCards.find(c => c.id === card.id);
                                    return (
                                        <div 
                                            key={card.id}
                                            onClick={() => handleSelectCard(card)}
                                            className={`relative cursor-pointer transition-all duration-300 transform ${isSelected ? 'ring-4 ring-orange-500 scale-95 opacity-50' : 'hover:scale-105'}`}
                                        >
                                            <DropsidersCardComponent card={card} scale={0.4} />
                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shadow-lg">
                                                        ✓
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Panel: The Altar / Forge */}
                    <div className="flex flex-col items-center justify-center bg-black/60 border border-orange-500/20 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
                        
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.15)_0%,transparent_70%)] pointer-events-none" />

                        <h3 className="text-xl font-bold text-white mb-8 tracking-widest uppercase text-center">
                            Autel de Fusion
                        </h3>

                        {/* Slots */}
                        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                            <div className="absolute inset-0 border-[2px] border-dashed border-orange-500/30 rounded-full animate-[spin_20s_linear_infinite]" />
                            <div className="absolute inset-4 border-[1px] border-solid border-orange-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                            
                            {Array.from({ length: rule.required }).map((_, i) => {
                                const angle = (i * (360 / rule.required)) * (Math.PI / 180);
                                const radius = 90; // distance from center
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                
                                const card = selectedCards[i];

                                return (
                                    <div 
                                        key={i}
                                        className="absolute w-16 h-24 rounded-lg border-2 border-white/10 flex items-center justify-center bg-black/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-all duration-500"
                                        style={{
                                            transform: `translate(${x}px, ${y}px) rotate(${angle}rad)`,
                                        }}
                                    >
                                        {card ? (
                                            <div className="scale-[0.25] origin-center -translate-y-16">
                                                <DropsidersCardComponent card={card} scale={1} />
                                            </div>
                                        ) : (
                                            <span className="text-white/20 text-xs">Vide</span>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Core Core */}
                            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-[0_0_30px_rgba(249,115,22,0.6)] flex items-center justify-center z-10 transition-all duration-300 ${isCrafting ? 'scale-150 animate-pulse' : 'scale-100'}`}>
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>

                        <button
                            onClick={handleCraft}
                            disabled={selectedCards.length !== rule.required || isCrafting}
                            className={`w-full py-4 font-black uppercase tracking-widest rounded-lg transition-all ${
                                selectedCards.length === rule.required && !isCrafting
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-105'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                            }`}
                        >
                            {isCrafting ? 'Fusion en cours...' : 'Forger'}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}
