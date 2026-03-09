import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Camera, Gamepad2, Star, Info, Car, Bell,
    Sparkles, Trophy, Plus, Check, AlertCircle,
    Music, Shield, Palette, Megaphone, MapPin,
    RefreshCw, X, Download, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MemoryWall } from '../components/community/MemoryWall';
import { QuizSection } from '../components/community/QuizSection';
import { AvisSection } from '../components/community/AvisSection';
import { GuideSection } from '../components/community/GuideSection';
import { CovoitSection } from '../components/community/CovoitSection';
import { AlertsSection } from '../components/community/AlertsSection';
import galerieData from '../data/galerie.json';
import confetti from 'canvas-confetti';

// --- HALL OF FAME MOCK DATA ---
const HALL_OF_FAME = [
    { id: 'h1', playerName: 'Alex', festivalName: 'NEON WAVE', djs: ['Boris Brejcha', 'Charlotte de Witte', 'Amelie Lens'], budget: '2.4M€', date: 'Juin 2026' },
    { id: 'h2', playerName: 'Lucas', festivalName: 'BASS MOUNTAIN', djs: ['Skrillex', 'Fred again..', 'I Hate Models'], budget: '4.1M€', date: 'Août 2026' },
    { id: 'h3', playerName: 'Emma', festivalName: 'TECHNO GARDEN', djs: ['Nina Kraviz', 'Carl Cox', 'Adam Beyer'], budget: '1.8M€', date: 'Juillet 2026' },
];

// --- FESTIVAL CREATOR GAME DATA ---
const DJ_POOL = [
    { id: '1', name: 'Boris Brejcha', price: 120000, genre: 'High-Tech Minimal', popularity: 95 },
    { id: '2', name: 'Charlotte de Witte', price: 150000, genre: 'Techno', popularity: 98 },
    { id: '3', name: 'Amelie Lens', price: 140000, genre: 'Techno', popularity: 97 },
    { id: '4', name: 'Nina Kraviz', price: 110000, genre: 'Techno/Acid', popularity: 94 },
    { id: '5', name: 'Carl Cox', price: 200000, genre: 'House/Techno', popularity: 99 },
    { id: '6', name: 'Peggy Gou', price: 130000, genre: 'House', popularity: 96 },
    { id: '7', name: 'Michael Bibi', price: 95000, genre: 'Tech House', popularity: 92 },
    { id: '8', name: 'Mochakk', price: 85000, genre: 'Tech House', popularity: 90 },
    { id: '9', name: 'Pawsa', price: 55000, genre: 'Tech House', popularity: 85 },
    { id: '10', name: 'Honey Dijon', price: 75000, genre: 'House', popularity: 88 },
    { id: '11', name: 'Anotr', price: 65000, genre: 'Minimal House', popularity: 87 },
    { id: '12', name: 'Laurent Garnier', price: 100000, genre: 'Eclectic', popularity: 93 },
    { id: '13', name: 'Folamour', price: 60000, genre: 'House', popularity: 86 },
    { id: '14', name: 'I Hate Models', price: 90000, genre: 'Industrial Techno', popularity: 91 },
    { id: '15', name: 'Adam Beyer', price: 130000, genre: 'Techno', popularity: 95 },
    { id: '16', name: 'Skrillex', price: 250000, genre: 'Bass Music', popularity: 99 },
    { id: '17', name: 'Fred again..', price: 220000, genre: 'Electronic', popularity: 99 },
    { id: '18', name: 'Vintage Culture', price: 95000, genre: 'House', popularity: 92 },
];

const FIX_COSTS = [
    { id: 'security', name: 'Sécurité & Secours', basePrice: 45000, icon: Shield, minPercent: 10 },
    { id: 'sceno', name: 'Scénographie & VJs', basePrice: 65000, icon: Palette, minPercent: 15 },
    { id: 'marketing', name: 'Marketing & Pub', basePrice: 25000, icon: Megaphone, minPercent: 5 },
    { id: 'venue', name: 'Location du lieu', basePrice: 40000, icon: MapPin, minPercent: 8 },
];

export function Community() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'WALL' | 'PHOTOS' | 'QUIZZ' | 'AVIS' | 'GUIDE' | 'COVOIT' | 'ALERTS' | 'GAME'>('WALL');

    // Game State
    const [gameStarted, setGameStarted] = useState(false);
    const [budget, setBudget] = useState(0);
    const [selectedDjs, setSelectedDjs] = useState<typeof DJ_POOL>([]);
    const [selectedCosts, setSelectedCosts] = useState<string[]>([]);
    const [gameState, setGameState] = useState<'SETUP' | 'ONBOARDING' | 'BOOKING' | 'POSTER'>('SETUP');

    // Player Info
    const [playerName, setPlayerName] = useState('');
    const [playerEmail, setPlayerEmail] = useState('');
    const [festivalName, setFestivalName] = useState('');

    // Stats
    const totalDjsCost = useMemo(() => selectedDjs.reduce((acc, dj) => acc + dj.price, 0), [selectedDjs]);
    const totalExtraCost = useMemo(() => {
        return FIX_COSTS
            .filter(c => selectedCosts.includes(c.id))
            .reduce((acc, c) => acc + c.basePrice, 0);
    }, [selectedCosts]);
    const totalSpent = totalDjsCost + totalExtraCost;
    const remainingBudget = budget - totalSpent;

    const startNewGame = () => {
        const randomBudget = Math.floor(Math.random() * (5000000 - 500000 + 1)) + 500000;
        setBudget(randomBudget);
        setSelectedDjs([]);
        setSelectedCosts([]);
        setGameState('ONBOARDING');
        setGameStarted(true);
    };

    const confirmOnboarding = () => {
        if (!playerName || !playerEmail || !festivalName) return;
        setGameState('BOOKING');
    };

    const toggleDj = (dj: typeof DJ_POOL[0]) => {
        if (selectedDjs.find(d => d.id === dj.id)) {
            setSelectedDjs(prev => prev.filter(d => d.id !== dj.id));
        } else {
            if (totalSpent + dj.price > budget) {
                // Flash Budget error
                return;
            }
            setSelectedDjs(prev => [...prev, dj]);
        }
    };

    const toggleCost = (costId: string) => {
        if (selectedCosts.includes(costId)) {
            setSelectedCosts(prev => prev.filter(id => id !== costId));
        } else {
            const cost = FIX_COSTS.find(c => c.id === costId);
            if (cost && totalSpent + cost.basePrice > budget) return;
            setSelectedCosts(prev => [...prev, costId]);
        }
    };

    const generatePoster = () => {
        if (selectedCosts.length < 4) return; // Need all mandatory units
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0033', '#00ffff', '#ffffff']
        });
        setGameState('POSTER');
    };

    const resetGame = () => {
        setGameState('SETUP');
        setGameStarted(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-32">
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-red/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-neon-cyan/5 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-neon-red/10 rounded-xl">
                                <Users className="w-6 h-6 text-neon-red" />
                            </div>
                            <span className="text-neon-red font-black tracking-[0.3em] text-[10px] uppercase">Espace Communauté</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-display font-black mb-4 uppercase italic tracking-tighter">
                            DROPSIDERS <span className="text-neon-red drop-shadow-[0_0_20px_rgba(255,0,51,0.5)]">LAB</span>
                        </h1>
                        <p className="text-white/40 max-w-xl text-xs font-black uppercase tracking-widest leading-loose">
                            Connectez-vous avec la scène, partagez vos récaps, et créez vos propres expériences. Le futur des festivals s'écrit ici.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/communaute/partager')}
                        className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:bg-neon-red hover:text-white transition-all duration-500 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-4">
                            Partager Album
                            <div className="p-2 bg-black text-white group-hover:bg-white group-hover:text-neon-red rounded-lg transition-colors">
                                <Camera className="w-4 h-4" />
                            </div>
                        </span>
                    </motion.button>
                </motion.div>

                {/* Enhanced Tabs */}
                <div className="mb-16">
                    <div className="flex flex-wrap items-center gap-3 p-1.5 bg-white/5 backdrop-blur-3xl rounded-3xl w-fit border border-white/10">
                        {[
                            { id: 'WALL', icon: Star, label: 'Mur de Souvenirs' },
                            { id: 'PHOTOS', icon: Camera, label: 'Albums Photo' },
                            { id: 'QUIZZ', icon: Gamepad2, label: 'Défis & Quiz' },
                            { id: 'GAME', icon: Sparkles, iconClass: 'text-amber-400', label: 'Tycoon Festival' },
                            { id: 'AVIS', icon: Heart, label: 'Avis' },
                            { id: 'GUIDE', icon: Info, label: 'Guide Pratique' },
                            { id: 'COVOIT', icon: Car, label: 'Covoiturage' },
                            { id: 'ALERTS', icon: Bell, label: 'Alertes' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group ${activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white'}`}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="community-tab-bg-v2"
                                        className="absolute inset-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                        style={{ borderRadius: '16px' }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <tab.icon className={`w-4 h-4 relative z-10 transition-colors ${activeTab === tab.id ? 'text-neon-red' : tab.iconClass || 'group-hover:text-neon-red'}`} />
                                <span className="relative z-10 tracking-widest">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'WALL' && (
                        <motion.div
                            key="wall"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <MemoryWall galerieData={galerieData} />
                        </motion.div>
                    )}

                    {activeTab === 'QUIZZ' && (
                        <motion.div
                            key="quizz"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                        >
                            <QuizSection />
                        </motion.div>
                    )}

                    {activeTab === 'PHOTOS' && (
                        <motion.div
                            key="photos"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            {/* Reuse Galerie components or similar styled cards */}
                            {galerieData.slice(0, 8).map((album, idx) => (
                                <motion.div
                                    key={album.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="group relative aspect-[4/5] bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-700 shadow-2xl"
                                >
                                    <img
                                        src={album.cover}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                        alt=""
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-0.5 bg-neon-red text-white text-[8px] font-black uppercase tracking-wider rounded-md">
                                                {album.category}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tighter leading-tight group-hover:text-neon-red transition-colors">
                                            {album.title}
                                        </h3>
                                        <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em] mt-3">
                                            {album.date} • {album.images.length} Photos
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => navigate(`/galerie/${album.id}`)}
                                    >
                                        <Plus className="w-5 h-5 text-white" />
                                    </motion.button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'GAME' && (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-7xl mx-auto"
                        >
                            {!gameStarted ? (
                                <div className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[3rem] p-12 md:p-24 text-center">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
                                    <Sparkles className="w-20 h-20 text-amber-400 mx-auto mb-10 animate-pulse" />
                                    <h2 className="text-4xl md:text-7xl font-display font-black mb-8 uppercase italic tracking-tighter">
                                        DEVIENS <span className="text-amber-400">ORGANISATEUR</span>
                                    </h2>
                                    <p className="text-white/40 max-w-2xl mx-auto text-sm font-medium uppercase tracking-[0.25em] leading-loose mb-12">
                                        Budget limité, programmation de luxe et logistique sans faille. Réussiras-tu à créer le festival parfait sans faire faillite ?
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={startNewGame}
                                        className="px-16 py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:bg-amber-400 hover:shadow-[0_20px_40px_rgba(251,191,36,0.2)] transition-all duration-500 mb-20"
                                    >
                                        DÉMARRER LA PRODUCTION
                                    </motion.button>

                                    {/* Hall of Fame Section */}
                                    <div className="max-w-5xl mx-auto mt-20">
                                        <div className="flex items-center gap-4 mb-12 justify-center">
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white/40">Hall of Fame</h3>
                                            <div className="h-[1px] flex-1 bg-white/10" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                            {HALL_OF_FAME.map((poster) => (
                                                <motion.div
                                                    key={poster.id}
                                                    whileHover={{ y: -10, rotate: 1 }}
                                                    className="group relative aspect-[1.3/2] bg-[#111] border-[6px] border-white shadow-2xl rounded-2xl p-6 overflow-hidden flex flex-col items-center text-center"
                                                >
                                                    <div className="absolute inset-0 opacity-10 flex items-center justify-center -rotate-12 pointer-events-none text-2xl font-black">DROPSIDERS</div>

                                                    <div className="relative z-10 w-full">
                                                        <span className="text-[6px] font-black uppercase tracking-[0.3em] text-neon-red block mb-1">Production par {poster.playerName}</span>
                                                        <h4 className="text-xl font-display font-black uppercase italic tracking-tighter text-white leading-none mb-3">{poster.festivalName}</h4>
                                                        <div className="w-10 h-0.5 bg-white mx-auto mb-6" />

                                                        <div className="space-y-1 mb-6">
                                                            {(poster as any).djs.map((dj: string, idx: number) => (
                                                                <p key={dj} className={`text-[7px] font-bold text-white uppercase tracking-widest ${idx === 0 ? 'text-[9px] font-black' : 'opacity-60'}`}>{dj}</p>
                                                            ))}
                                                        </div>

                                                        <div className="pt-4 border-t border-white/10 flex justify-between items-end w-full">
                                                            <div className="text-left">
                                                                <p className="text-[5px] font-black text-white/40 uppercase">Budget</p>
                                                                <p className="text-[7px] font-black text-white uppercase italic">{(poster as any).budget}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <img src="/Logo.png" className="h-2 w-auto object-contain opacity-50" alt="" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : gameState === 'ONBOARDING' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-2xl mx-auto p-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem]"
                                >
                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-8 text-center text-amber-400">Dossier de Production</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Prénom de l'organisateur</label>
                                            <input
                                                type="text"
                                                value={playerName}
                                                onChange={(e) => setPlayerName(e.target.value)}
                                                className="w-full px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-400 transition-colors"
                                                placeholder="TON PRÉNOM"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Email (pour l'envoi de l'affiche)</label>
                                            <input
                                                type="email"
                                                value={playerEmail}
                                                onChange={(e) => setPlayerEmail(e.target.value)}
                                                className="w-full px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-400 transition-colors"
                                                placeholder="TON@EMAIL.COM"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Nom du Festival</label>
                                            <input
                                                type="text"
                                                value={festivalName}
                                                onChange={(e) => setFestivalName(e.target.value)}
                                                className="w-full px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-amber-400 transition-colors"
                                                placeholder="NOM DE TON FESTIVAL"
                                            />
                                        </div>
                                        <button
                                            onClick={confirmOnboarding}
                                            disabled={!playerName || !playerEmail || !festivalName}
                                            className="w-full py-6 mt-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-amber-400 transition-all duration-500 disabled:opacity-20"
                                        >
                                            VALIDER LE DOSSIER
                                        </button>
                                    </div>
                                </motion.div>
                            ) : gameState === 'BOOKING' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    {/* Sidebar: Budget & Controls */}
                                    <div className="lg:col-span-4 space-y-8">
                                        <div className="sticky top-24 p-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl">
                                            <div className="flex items-center justify-between mb-10">
                                                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Production Control</h3>
                                                <button onClick={resetGame} className="p-2 text-white/20 hover:text-white transition-colors">
                                                    <X className="w-6 h-6" />
                                                </button>
                                            </div>

                                            <div className="space-y-10">
                                                <div>
                                                    <div className="flex justify-between items-end mb-4">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Budget Total</span>
                                                        <span className="text-2xl font-black font-mono text-white tracking-widest">{budget.toLocaleString()}€</span>
                                                    </div>
                                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full ${remainingBudget < 0 ? 'bg-red-500' : 'bg-amber-400'}`}
                                                            animate={{ width: `${(totalSpent / budget) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-3">
                                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Dépensé: {totalSpent.toLocaleString()}€</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${remainingBudget < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                                                            Reste: {remainingBudget.toLocaleString()}€
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Unités de Sécurité & Logistique</span>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {FIX_COSTS.map(cost => (
                                                            <button
                                                                key={cost.id}
                                                                onClick={() => toggleCost(cost.id)}
                                                                className={`p-6 rounded-3xl border transition-all duration-500 group flex flex-col items-center gap-3 text-center ${selectedCosts.includes(cost.id) ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                                                            >
                                                                <cost.icon className={`w-6 h-6 ${selectedCosts.includes(cost.id) ? 'text-neon-red' : 'group-hover:text-white'}`} />
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[8px] font-black uppercase tracking-tight">{cost.name}</span>
                                                                    <span className="text-[10px] font-mono font-bold">{cost.basePrice.toLocaleString()}€</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={selectedCosts.length < 4 || selectedDjs.length === 0 || remainingBudget < 0}
                                                    onClick={generatePoster}
                                                    className="w-full py-6 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.3em] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-neon-red hover:text-white transition-all duration-500 flex items-center justify-center gap-4"
                                                >
                                                    Générer la Line-up
                                                    <Sparkles className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main: DJ List */}
                                    <div className="lg:col-span-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-3xl font-black italic tracking-tighter uppercase">Booking Gallery</h3>
                                            <div className="flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full">
                                                <Users className="w-4 h-4 text-amber-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{selectedDjs.length} Artistes Bookés</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {DJ_POOL.map((dj, i) => (
                                                <motion.button
                                                    key={dj.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => toggleDj(dj)}
                                                    className={`relative group p-8 rounded-[2rem] border transition-all duration-500 text-left overflow-hidden ${selectedDjs.find(d => d.id === dj.id) ? 'bg-amber-400 border-amber-400' : 'bg-white/5 border-white/10 hover:border-amber-400/50'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-10">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${selectedDjs.find(d => d.id === dj.id) ? 'bg-black/10 border-black/10' : 'bg-white/5 border-white/10'}`}>
                                                            <Music className={`w-6 h-6 ${selectedDjs.find(d => d.id === dj.id) ? 'text-black' : 'text-amber-400'}`} />
                                                        </div>
                                                        {selectedDjs.find(d => d.id === dj.id) && <motion.div layoutId={`check-${dj.id}`}><Check className="w-6 h-6 text-black" /></motion.div>}
                                                    </div>

                                                    <h4 className={`text-xl font-black uppercase italic tracking-tighter mb-1 transition-colors ${selectedDjs.find(d => d.id === dj.id) ? 'text-black' : 'text-white'}`}>
                                                        {dj.name}
                                                    </h4>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-6 transition-colors ${selectedDjs.find(d => d.id === dj.id) ? 'text-black/60' : 'text-white/30'}`}>
                                                        {dj.genre}
                                                    </p>

                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-lg font-mono font-black transition-colors ${selectedDjs.find(d => d.id === dj.id) ? 'text-black' : 'text-amber-400'}`}>
                                                            {dj.price.toLocaleString()}€
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <Trophy className={`w-3 h-3 ${selectedDjs.find(d => d.id === dj.id) ? 'text-black' : 'text-white/20'}`} />
                                                            <span className={`text-[10px] font-black ${selectedDjs.find(d => d.id === dj.id) ? 'text-black' : 'text-white/20'}`}>{dj.popularity}</span>
                                                        </div>
                                                    </div>

                                                    {!selectedDjs.find(d => d.id === dj.id) && dj.price > remainingBudget && (
                                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <AlertCircle className="w-8 h-8 text-red-500" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Budget Insuffisant</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative aspect-[1.3/2] bg-[#111] border-[12px] border-white shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[2rem] p-12 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 opacity-20 flex items-center justify-center -rotate-12 pointer-events-none">
                                            <span className="text-[200px] font-black text-white/10 uppercase tracking-tighter leading-none">DROPS<br />IDERS</span>
                                        </div>

                                        <div className="relative z-10 h-full flex flex-col items-center text-center">
                                            <div className="flex flex-col items-center gap-4 mb-20">
                                                <div className="px-4 py-1.5 bg-neon-red text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-sm">
                                                    Dropsiders Lab Présente
                                                </div>
                                                <h1 className="text-6xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                                    {festivalName.split(' ')[0]} <span className="text-neon-red">{festivalName.split(' ').slice(1).join(' ') || 'EXPERIENCE'}</span>
                                                </h1>
                                                <div className="w-40 h-1 bg-white" />
                                            </div>

                                            <div className="flex-1 w-full space-y-12">
                                                <div>
                                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-4 block">Featuring</span>
                                                    <div className="flex flex-col gap-4">
                                                        {selectedDjs.map((dj, i) => (
                                                            <motion.span
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.5 + (i * 0.1) }}
                                                                key={dj.id}
                                                                className={`font-display font-black uppercase italic tracking-tighter leading-none ${i === 0 ? 'text-4xl text-white' : 'text-2xl text-white/70'}`}
                                                            >
                                                                {dj.name}{i < selectedDjs.length - 1 && " •"}
                                                            </motion.span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full pt-12 border-t border-white/10 flex justify-between items-end">
                                                <div className="text-left">
                                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Date de l'événement</p>
                                                    <p className="text-xl font-black text-white uppercase italic">Summer 2026</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1.5 leading-none">
                                                    <img
                                                        src="/Logo.png"
                                                        className="h-10 w-auto object-contain mb-2"
                                                        alt="DROPSIDERS"
                                                    />
                                                    <div className="flex flex-col items-end opacity-40">
                                                        <span className="text-[7px] font-black uppercase tracking-widest leading-none">Powered by Dropsiders</span>
                                                        <span className="text-[6px] font-black uppercase tracking-[0.3em] mt-0.5">Lab Production © 2026</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <div className="mt-16 flex justify-center gap-6">
                                        <button
                                            onClick={resetGame}
                                            className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Nouveau Projet
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="px-12 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all flex items-center gap-3"
                                        >
                                            <Download className="w-4 h-4" /> Sauvegarder l'Affiche
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'AVIS' && (
                        <motion.div
                            key="avis"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <AvisSection />
                        </motion.div>
                    )}

                    {activeTab === 'GUIDE' && <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><GuideSection /></motion.div>}
                    {activeTab === 'COVOIT' && <motion.div key="covoit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><CovoitSection /></motion.div>}
                    {activeTab === 'ALERTS' && <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><AlertsSection /></motion.div>}

                </AnimatePresence>

                {/* Footer CTA */}
                {activeTab !== 'GAME' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-32 p-12 md:p-24 bg-gradient-to-br from-neon-red/[0.05] to-neon-cyan/[0.05] border border-white/10 rounded-[4rem] text-center"
                    >
                        <h2 className="text-4xl md:text-6xl font-display font-black mb-8 uppercase italic tracking-tighter">
                            REJOINS LE <span className="text-neon-cyan">MOUVEMENT</span>
                        </h2>
                        <p className="text-white/40 max-w-2xl mx-auto text-xs font-black uppercase tracking-[0.3em] leading-loose mb-12">
                            Abonne-toi à notre newsletter pour ne rien rater des futures extensions du Lab Dropsiders.
                        </p>
                        <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="TON.EMAIL@FESTIVAL.FR"
                                className="flex-1 px-8 py-5 bg-black/40 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-neon-red transition-colors"
                            />
                            <button className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all">
                                OK
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Community;
