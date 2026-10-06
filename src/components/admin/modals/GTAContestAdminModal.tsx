import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Trophy, RefreshCw, CheckCircle2, XCircle, AlertCircle, 
    Gift, Sparkles, User, Instagram, Search, Download, Trash2, 
    Dice5, ShieldCheck, Gamepad2, Mail, ExternalLink, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
    getAllContestEntries, 
    saveAllContestEntries, 
    type GTAContestEntry 
} from '../../../utils/gtaContestSecurity';

interface GTAContestAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GTAContestAdminModal({ isOpen, onClose }: GTAContestAdminModalProps) {
    const [entries, setEntries] = useState<GTAContestEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<GTAContestEntry | null>(null);

    // Lottery / Draw State
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentRollName, setCurrentRollName] = useState('');
    const [winner, setWinner] = useState<GTAContestEntry | null>(null);
    const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

    // Load participants
    const refreshEntries = () => {
        const data = getAllContestEntries();
        setEntries([...data]);
    };

    useEffect(() => {
        if (isOpen) {
            refreshEntries();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filtered lists
    const query = searchQuery.toLowerCase().trim();
    const filteredEntries = entries.filter(e => 
        e.nom.toLowerCase().includes(query) ||
        e.prenom.toLowerCase().includes(query) ||
        e.instagram.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query)
    );

    // 2 Distinct Columns
    const validatedParticipants = filteredEntries.filter(e => e.status === 'VALIDATED');
    const failedOrPendingParticipants = filteredEntries.filter(e => e.status !== 'VALIDATED');

    // Global Statistics
    const totalCount = entries.length;
    const ps5Count = entries.filter(e => e.plateforme === 'PlayStation 5 (PS5)').length;
    const xboxCount = entries.filter(e => e.plateforme === 'Xbox').length;
    const validatedCount = entries.filter(e => e.status === 'VALIDATED').length;
    const pendingOptInCount = entries.filter(e => e.status === 'PENDING_OPT_IN').length;
    const failedCount = entries.filter(e => e.status === 'FAILED').length;
    const totalReferrals = entries.reduce((acc, curr) => acc + (curr.referralCount || 0), 0);
    const totalWeightedTickets = validatedParticipants.reduce((acc, curr) => acc + (curr.totalTickets || 1), 0);

    // Action: Validate opt-in manually
    const handleManualValidateOptIn = (entry: GTAContestEntry) => {
        const all = getAllContestEntries();
        const found = all.find(e => e.id === entry.id);
        if (found) {
            found.status = 'VALIDATED';
            found.isOptedIn = true;
            found.optedInAt = new Date().toISOString();
            found.totalTickets = 1 + (found.hasAccountBonus ? 1 : 0) + (found.referralCount || 0);
            saveAllContestEntries(all);
            refreshEntries();
        }
    };

    // Action: Weighted Lottery Draw
    const handleLaunchWeightedDraw = () => {
        const pool: GTAContestEntry[] = [];
        const eligible = entries.filter(e => e.status === 'VALIDATED');

        if (eligible.length === 0) {
            alert("Aucun participant validé éligible pour le tirage au sort !");
            return;
        }

        // Build weighted pool
        eligible.forEach(entry => {
            const tickets = Math.max(1, entry.totalTickets || 1);
            for (let i = 0; i < tickets; i++) {
                pool.push(entry);
            }
        });

        setIsDrawing(true);
        let rollCounter = 0;
        const totalRolls = 35;
        const interval = setInterval(() => {
            rollCounter++;
            const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
            setCurrentRollName(`${randomCandidate.prenom} ${randomCandidate.nom} (${randomCandidate.instagram})`);

            if (rollCounter >= totalRolls) {
                clearInterval(interval);
                // Pick final lucky winner
                const finalWinner = pool[Math.floor(Math.random() * pool.length)];
                setWinner(finalWinner);
                setIsDrawing(false);
                setIsWinnerModalOpen(true);

                // Celebrate!
                confetti({
                    particleCount: 150,
                    spread: 90,
                    origin: { y: 0.5 },
                    colors: ['#ff007f', '#00f0ff', '#ffe600', '#ffffff']
                });
            }
        }, 100);
    };

    // Export CSV
    const handleExportCSV = () => {
        const headers = ["ID", "Nom", "Prenom", "Instagram", "Email", "Plateforme", "Statut", "Tickets", "Parrainages", "BonusCompte", "Date"];
        const rows = entries.map(e => [
            e.id,
            `"${e.nom}"`,
            `"${e.prenom}"`,
            `"${e.instagram}"`,
            `"${e.email}"`,
            `"${e.plateforme}"`,
            `"${e.status}"`,
            e.totalTickets || 0,
            e.referralCount || 0,
            e.hasAccountBonus ? "OUI" : "NON",
            `"${e.createdAt}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dropsiders_gta6_participants_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0a0614] border border-[#ff007f]/40 rounded-[2.5rem] w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(255,0,127,0.25)] relative"
                >
                    {/* Top gradient glow bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff007f] via-[#ffe600] to-[#00f0ff]" />

                    {/* =========================================================================
                        HEADER : TITRE + BOUTON TIRAGE AU SORT + ACTUALISER + FERMER
                    ========================================================================= */}
                    <div className="p-6 md:p-8 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/40">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#ff007f]/20 border border-[#ff007f]/40 flex items-center justify-center shadow-[0_0_15px_#ff007f]">
                                <Gamepad2 className="w-6 h-6 text-[#ff007f]" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black font-display uppercase italic tracking-tight text-white flex items-center gap-3">
                                    CONCOURS GTA 6 <span className="text-[#00f0ff]">• GESTION & TIRAGE</span>
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    Tableau de bord officiel • Anti-triche • Tirage pondéré
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* BOUTON TIRAGE AU SORT PONDÉRÉ */}
                            <button
                                onClick={handleLaunchWeightedDraw}
                                disabled={isDrawing || validatedParticipants.length === 0}
                                className="px-6 py-3.5 bg-gradient-to-r from-[#ff007f] via-[#ffe600] to-[#00f0ff] text-black font-black font-display uppercase italic tracking-wider text-xs rounded-2xl shadow-[0_0_25px_rgba(255,0,127,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Trophy className="w-4 h-4 text-black" />
                                {isDrawing ? 'TIRAGE EN COURS...' : 'LANCER LE TIRAGE AU SORT'}
                            </button>

                            {/* EXPORT CSV */}
                            <button
                                onClick={handleExportCSV}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all"
                                title="Exporter en CSV"
                            >
                                <Download className="w-5 h-5" />
                            </button>

                            {/* REFRESH */}
                            <button
                                onClick={refreshEntries}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-300 hover:text-white transition-all"
                                title="Actualiser la liste"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>

                            {/* FERMER */}
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* =========================================================================
                        STATISTIQUES GLOBALES
                    ========================================================================= */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 md:px-8 bg-white/[0.02] border-b border-white/10 text-center">
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total Participations</span>
                            <span className="text-xl sm:text-2xl font-black font-display text-white">{totalCount}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">PS5 vs Xbox</span>
                            <span className="text-xl sm:text-2xl font-black font-display text-white">
                                <span className="text-[#0070d1]">{ps5Count}</span> / <span className="text-[#107c10]">{xboxCount}</span>
                            </span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">🟢 Validés (3/3 + Opt-in)</span>
                            <span className="text-xl sm:text-2xl font-black font-display text-green-400">{validatedCount}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">🟡 En attente Opt-in</span>
                            <span className="text-xl sm:text-2xl font-black font-display text-yellow-400">{pendingOptInCount}</span>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Parrainages Actifs</span>
                            <span className="text-xl sm:text-2xl font-black font-display text-[#00f0ff]">{totalReferrals}</span>
                        </div>
                    </div>

                    {/* =========================================================================
                        BARRE DE RECHERCHE
                    ========================================================================= */}
                    <div className="p-4 md:px-8 bg-black/20 border-b border-white/5 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, prénom, @instagram, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-[#ff007f]"
                            />
                        </div>
                        <div className="text-xs text-gray-400 font-bold">
                            Chances totales cumulées dans le chapeau : <strong className="text-[#ff007f]">{totalWeightedTickets} tickets</strong>
                        </div>
                    </div>

                    {/* =========================================================================
                        TABLEAU EN 2 COLONNES DISTINCTES
                    ========================================================================= */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
                        
                        {/* COLONNE 1 : 🟢 PARTICIPANTS VALIDÉS (ÉLIGIBLES AU TIRAGE) */}
                        <div className="flex flex-col h-full overflow-hidden bg-green-500/[0.02]">
                            <div className="p-4 px-6 bg-green-500/10 border-b border-green-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-green-400">
                                        1. PARTICIPANTS VALIDÉS ({validatedParticipants.length})
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase text-green-400/80 bg-green-500/20 px-2.5 py-0.5 rounded-full">
                                    ÉLIGIBLES TIRAGE
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {validatedParticipants.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        Aucun participant validé pour le moment.
                                    </div>
                                ) : (
                                    validatedParticipants.map((p) => (
                                        <div 
                                            key={p.id}
                                            onClick={() => setSelectedEntry(p)}
                                            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-green-400/50 hover:bg-white/10 transition-all cursor-pointer flex flex-col gap-2 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white text-sm">
                                                        {p.prenom} {p.nom}
                                                    </span>
                                                    <span className="text-xs font-bold text-[#00f0ff]">
                                                        {p.instagram}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                    p.plateforme.includes('PS5') 
                                                        ? 'bg-[#0070d1]/30 text-[#0070d1] border border-[#0070d1]/40' 
                                                        : 'bg-[#107c10]/30 text-[#107c10] border border-[#107c10]/40'
                                                }`}>
                                                    {p.plateforme.includes('PS5') ? 'PS5' : 'XBOX'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{p.email}</span>
                                                <div className="flex items-center gap-2">
                                                    {p.hasAccountBonus && (
                                                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-md">
                                                            +1 Compte
                                                        </span>
                                                    )}
                                                    {p.referralCount > 0 && (
                                                        <span className="text-[10px] font-bold text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded-md">
                                                            +{p.referralCount} Parrain
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-black text-[#ff007f] bg-[#ff007f]/10 px-2.5 py-0.5 rounded-full border border-[#ff007f]/30">
                                                        🎟️ {p.totalTickets} chance{p.totalTickets > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* COLONNE 2 : 🔴 PARTICIPANTS ÉCHOUÉS OU EN ATTENTE D'OPT-IN */}
                        <div className="flex flex-col h-full overflow-hidden bg-red-500/[0.02]">
                            <div className="p-4 px-6 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-red-400">
                                        2. ÉCHOUÉS & EN ATTENTE D'OPT-IN ({failedOrPendingParticipants.length})
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase text-red-400/80 bg-red-500/20 px-2.5 py-0.5 rounded-full">
                                    NON ÉLIGIBLES
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {failedOrPendingParticipants.length === 0 ? (
                                    <div className="py-12 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        Aucun participant en échec ou en attente.
                                    </div>
                                ) : (
                                    failedOrPendingParticipants.map((p) => (
                                        <div 
                                            key={p.id}
                                            onClick={() => setSelectedEntry(p)}
                                            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-red-400/50 hover:bg-white/10 transition-all cursor-pointer flex flex-col gap-2 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white text-sm">
                                                        {p.prenom} {p.nom}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-400">
                                                        {p.instagram}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                    p.status === 'PENDING_OPT_IN' 
                                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' 
                                                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                                                }`}>
                                                    {p.status === 'PENDING_OPT_IN' ? 'ATTENTE OPT-IN' : 'ÉCHEC QUESTIONS'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span>{p.email}</span>
                                                <span className="text-[10px] text-gray-400 italic">
                                                    {p.rejectionReason || 'Réponses incorrectes'}
                                                </span>
                                            </div>

                                            {/* Action si opt-in en attente */}
                                            {p.status === 'PENDING_OPT_IN' && (
                                                <div className="pt-2 border-t border-white/5 flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleManualValidateOptIn(p);
                                                        }}
                                                        className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-bold text-[10px] uppercase rounded-lg border border-yellow-500/30 transition-all"
                                                    >
                                                        Valider Opt-in Manuellement
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* =========================================================================
                        MODAL TIRAGE AU SORT EN COURS (ROULETTE NÉON)
                    ========================================================================= */}
                    {isDrawing && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-center">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="space-y-6 max-w-lg"
                            >
                                <div className="w-24 h-24 mx-auto rounded-3xl bg-[#ff007f]/20 border-2 border-[#ff007f] flex items-center justify-center animate-spin-slow shadow-[0_0_50px_#ff007f]">
                                    <Dice5 className="w-12 h-12 text-[#ff007f]" />
                                </div>
                                <h3 className="text-3xl font-black font-display uppercase italic tracking-tight text-white">
                                    TIRAGE AU SORT PONDÉRÉ EN COURS...
                                </h3>
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                                    Brassage des tickets et pondérations bonus Dropsiders
                                </p>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xl font-black font-display text-[#00f0ff] tracking-wider animate-pulse">
                                    {currentRollName || 'Sélection en cours...'}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* =========================================================================
                        MODAL ANNONCE DU VAINQUEUR GTA 6
                    ========================================================================= */}
                    <AnimatePresence>
                        {isWinnerModalOpen && winner && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.85, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: 30 }}
                                    className="bg-[#0d0221] border-2 border-[#ff007f] rounded-[3rem] p-8 sm:p-12 max-w-xl w-full shadow-[0_0_80px_rgba(255,0,127,0.6)] text-center relative overflow-hidden"
                                >
                                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#ff007f] to-[#ffe600] flex items-center justify-center mb-6 shadow-2xl">
                                        <Trophy className="w-10 h-10 text-black" />
                                    </div>

                                    <div className="inline-block px-4 py-1.5 rounded-full bg-[#ff007f]/20 border border-[#ff007f]/40 text-[10px] font-black uppercase tracking-widest text-[#ff007f] mb-3">
                                        ★ GAGNANT OFFICIEL DU JEU CONCOURS GTA 6 ★
                                    </div>

                                    <h3 className="text-3xl sm:text-4xl font-black font-display uppercase italic tracking-tight text-white mb-2">
                                        {winner.prenom} {winner.nom}
                                    </h3>
                                    <div className="text-xl font-black text-[#00f0ff] mb-6">
                                        {winner.instagram}
                                    </div>

                                    {/* Winner Details Card */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left text-xs space-y-3 mb-8">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold uppercase">Plateforme Choisie :</span>
                                            <span className="text-white font-black">{winner.plateforme}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold uppercase">Adresse E-mail :</span>
                                            <span className="text-white font-black">{winner.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 font-bold uppercase">Total Tickets Utilisés :</span>
                                            <span className="text-[#ff007f] font-black">{winner.totalTickets} Ticket(s)</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/10 pt-3">
                                            <span className="text-gray-400 font-bold uppercase">Bonus Compte / Parrainage :</span>
                                            <span className="text-yellow-400 font-black">
                                                {winner.hasAccountBonus ? 'Compte (+1) • ' : ''}
                                                {winner.referralCount} ami(s) parrainé(s)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`Gagnant GTA 6 Dropsiders: ${winner.prenom} ${winner.nom} (${winner.instagram}) - Email: ${winner.email} - Plateforme: ${winner.plateforme}`);
                                                alert("Coordonnées du vainqueur copiées dans le presse-papiers !");
                                            }}
                                            className="w-full py-4 bg-gradient-to-r from-[#ff007f] to-[#00f0ff] text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                                        >
                                            COPIER LES COORDONNÉES DU VAINQUEUR
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (confirm("Voulez-vous relancer un nouveau tirage sécurisé (ex: si le gagnant actuel ne répond pas) ?")) {
                                                    setIsWinnerModalOpen(false);
                                                    handleLaunchWeightedDraw();
                                                }
                                            }}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-yellow-400 font-bold uppercase text-[10px] tracking-widest rounded-2xl transition-all"
                                        >
                                            Relancer un tirage au sort de secours
                                        </button>

                                        <button
                                            onClick={() => setIsWinnerModalOpen(false)}
                                            className="w-full py-2 text-gray-500 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* =========================================================================
                        MODAL DÉTAILS D'UN PARTICIPANT (INSPECTION DES QUESTIONS)
                    ========================================================================= */}
                    <AnimatePresence>
                        {selectedEntry && (
                            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-[#0d0221] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-xl font-black font-display uppercase italic text-white">
                                                {selectedEntry.prenom} {selectedEntry.nom}
                                            </h4>
                                            <p className="text-xs text-[#00f0ff] font-bold">{selectedEntry.instagram} • {selectedEntry.plateforme}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedEntry(null)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 text-xs mb-6">
                                        <div className="p-4 bg-white/5 rounded-2xl space-y-2">
                                            <div className="font-bold text-gray-400 uppercase text-[10px]">Réponses soumises :</div>
                                            <div>
                                                <strong className="text-gray-300">Q1 (Solomun) :</strong> 
                                                <span className={`ml-2 font-bold ${selectedEntry.answersValid?.q1 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {selectedEntry.answers.q1} {selectedEntry.answersValid?.q1 ? '✓' : '✗'}
                                                </span>
                                            </div>
                                            <div>
                                                <strong className="text-gray-300">Q2 (Keinemusik) :</strong> 
                                                <span className={`ml-2 font-bold ${selectedEntry.answersValid?.q2 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {selectedEntry.answers.q2} {selectedEntry.answersValid?.q2 ? '✓' : '✗'}
                                                </span>
                                            </div>
                                            <div>
                                                <strong className="text-gray-300">Q3 (Prospa & Cloonee) :</strong> 
                                                <span className={`ml-2 font-bold ${selectedEntry.answersValid?.q3 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {selectedEntry.answers.q3} {selectedEntry.answersValid?.q3 ? '✓' : '✗'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-2xl space-y-1.5 text-gray-300">
                                            <div className="flex justify-between">
                                                <span>Empreinte :</span>
                                                <span className="font-mono text-gray-500">{selectedEntry.fingerprint.substring(0, 16)}...</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Code Parrain :</span>
                                                <span className="font-mono text-[#00f0ff]">{selectedEntry.referralCode}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Date soumission :</span>
                                                <span>{new Date(selectedEntry.createdAt).toLocaleString('fr-FR')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedEntry(null)}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-xs rounded-xl"
                                    >
                                        Fermer
                                    </button>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
