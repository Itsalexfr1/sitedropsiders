import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../context/UserContext';

// ─── QUEST DEFINITIONS ────────────────────────────────────────────────────────
const DAILY_QUESTS = [
    {
        id: 'vote_track',
        icon: '🎵',
        title: 'Voteur de Son',
        description: 'Vote pour un titre dans le Top 5 Tracks',
        xp: 50,
        storageKey: 'booster_top_tracks',
        reward: 'booster',
    },
    {
        id: 'vote_dj',
        icon: '🎧',
        title: 'Supporter de DJ',
        description: 'Vote pour un DJ dans le Top 100',
        xp: 75,
        storageKey: 'booster_wiki_djs',
        reward: 'booster',
    },
    {
        id: 'vote_venue',
        icon: '🏟',
        title: 'Passionné de Lieux',
        description: 'Vote pour un club ou festival',
        xp: 75,
        storageKey: 'booster_wiki_venues',
        reward: 'booster',
    },
    {
        id: 'open_site',
        icon: '🌐',
        title: 'Dropsider Quotidien',
        description: 'Visiter le site chaque jour',
        xp: 25,
        storageKey: 'daily_visit',
        reward: 'xp',
    },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function DailyQuestsPopup() {
    const { isLoggedIn, triggerBooster, earnPoints, showNotification } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [questStatus, setQuestStatus] = useState<Record<string, boolean>>({});
    const [claimedQuests, setClaimedQuests] = useState<Record<string, boolean>>({});
    const [allDone, setAllDone] = useState(false);
    const [superBoosterClaimed, setSuperBoosterClaimed] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const loadStatus = useCallback(() => {
        const status: Record<string, boolean> = {};
        const claimed: Record<string, boolean> = {};
        let allComplete = true;

        DAILY_QUESTS.forEach(q => {
            const questDate = localStorage.getItem(q.storageKey);
            status[q.id] = questDate === today;

            const claimedKey = `quest_claimed_${q.id}_${today}`;
            claimed[q.id] = localStorage.getItem(claimedKey) === 'true';

            if (!status[q.id]) allComplete = false;
        });

        setQuestStatus(status);
        setClaimedQuests(claimed);
        setAllDone(allComplete);
        setSuperBoosterClaimed(localStorage.getItem(`super_booster_${today}`) === 'true');
    }, [today]);

    // Mark daily visit quest on open
    useEffect(() => {
        if (!isLoggedIn) return;
        const visitKey = 'daily_visit';
        const lastVisit = localStorage.getItem(visitKey);
        if (lastVisit !== today) {
            localStorage.setItem(visitKey, today);
        }
        loadStatus();
    }, [isLoggedIn, today, loadStatus]);

    // Periodically refresh (so quests completed while page is open are detected)
    useEffect(() => {
        const interval = setInterval(loadStatus, 5000);
        return () => clearInterval(interval);
    }, [loadStatus]);

    const claimQuestReward = (questId: string) => {
        const quest = DAILY_QUESTS.find(q => q.id === questId);
        if (!quest) return;
        if (!questStatus[questId] || claimedQuests[questId]) return;

        const claimedKey = `quest_claimed_${questId}_${today}`;
        localStorage.setItem(claimedKey, 'true');

        if (quest.reward === 'booster') {
            triggerBooster();
            showNotification(`Quête "${quest.title}" complétée ! +Booster`, 'success');
        } else {
            earnPoints(quest.xp, 0);
            showNotification(`Quête "${quest.title}" complétée ! +${quest.xp} XP`, 'success');
        }

        setClaimedQuests(prev => ({ ...prev, [questId]: true }));
    };

    const claimSuperBooster = () => {
        if (!allDone || superBoosterClaimed) return;
        triggerBooster();
        earnPoints(300, 0);
        localStorage.setItem(`super_booster_${today}`, 'true');
        setSuperBoosterClaimed(true);
        showNotification('🎉 Super Booster quotidien réclamé ! +300 XP + 9 cartes !', 'success');
    };

    const completedCount = DAILY_QUESTS.filter(q => questStatus[q.id]).length;
    const progressPct = (completedCount / DAILY_QUESTS.length) * 100;

    if (!isLoggedIn) return null;

    return (
        <>
            {/* ── Floating Trigger Button ── */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 z-50 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
            >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 shadow-[0_0_30px_rgba(249,115,22,0.6)] flex items-center justify-center border-2 border-amber-300/50">
                    {/* Progress ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                        <circle
                            cx="28" cy="28" r="26" fill="none"
                            stroke="white" strokeWidth="3"
                            strokeDasharray={`${2 * Math.PI * 26}`}
                            strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPct / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                        />
                    </svg>
                    <span className="text-2xl z-10">⚡</span>
                    {/* Badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center border-2 border-orange-500 shadow-lg">
                        {completedCount}
                    </div>
                </div>
                <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-sm">
                    Quêtes du jour ({completedCount}/{DAILY_QUESTS.length})
                </div>
            </motion.button>

            {/* ── Modal ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, y: 40 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            className="fixed bottom-6 right-6 z-[70] w-[400px] max-w-[calc(100vw-2rem)]"
                        >
                            <div className="relative bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.3)]">

                                {/* Ambient top glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-orange-500/20 blur-[60px] pointer-events-none" />

                                {/* Header */}
                                <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-widest">
                                                ⚡ Quêtes du Jour
                                            </h2>
                                            <p className="text-xs text-white/40 mt-0.5">Complète-les toutes pour un Super Booster !</p>
                                        </div>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Global progress bar */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.6)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPct}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <span className="text-xs font-black text-orange-400 w-10 text-right">
                                            {completedCount}/{DAILY_QUESTS.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Quest list */}
                                <div className="px-4 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
                                    {DAILY_QUESTS.map((quest, i) => {
                                        const done = questStatus[quest.id];
                                        const claimed = claimedQuests[quest.id];
                                        return (
                                            <motion.div
                                                key={quest.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.07 }}
                                                className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                                                    done
                                                        ? 'bg-orange-500/10 border-orange-500/30'
                                                        : 'bg-white/3 border-white/5 hover:border-white/10'
                                                }`}
                                            >
                                                {/* Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                                                    done ? 'bg-orange-500/20' : 'bg-white/5'
                                                }`}>
                                                    {done ? '✅' : quest.icon}
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-black text-sm uppercase tracking-wide ${done ? 'text-white' : 'text-white/60'}`}>
                                                        {quest.title}
                                                    </p>
                                                    <p className="text-[11px] text-white/30 truncate">{quest.description}</p>
                                                    <p className="text-[10px] font-bold text-orange-400 mt-0.5">
                                                        {quest.reward === 'booster' ? '🃏 Booster de 9 cartes' : `+${quest.xp} XP`}
                                                    </p>
                                                </div>

                                                {/* CTA */}
                                                {done ? (
                                                    <button
                                                        onClick={() => claimQuestReward(quest.id)}
                                                        disabled={claimed}
                                                        className={`shrink-0 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                                                            claimed
                                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                                                                : 'bg-orange-500 text-white hover:scale-105 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                                                        }`}
                                                    >
                                                        {claimed ? '✓ OK' : 'Réclamer'}
                                                    </button>
                                                ) : (
                                                    <div className="shrink-0 w-6 h-6 rounded-full border-2 border-dashed border-white/20" />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Super Booster CTA */}
                                <div className="px-4 pb-5 pt-3 border-t border-white/5">
                                    <motion.button
                                        onClick={claimSuperBooster}
                                        disabled={!allDone || superBoosterClaimed}
                                        whileHover={allDone && !superBoosterClaimed ? { scale: 1.02 } : {}}
                                        whileTap={allDone && !superBoosterClaimed ? { scale: 0.97 } : {}}
                                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all relative overflow-hidden ${
                                            superBoosterClaimed
                                                ? 'bg-green-500/15 text-green-400 border border-green-500/30 cursor-default'
                                                : allDone
                                                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-white shadow-[0_0_30px_rgba(249,115,22,0.5)]'
                                                : 'bg-white/5 text-white/20 cursor-not-allowed border border-dashed border-white/10'
                                        }`}
                                    >
                                        {/* Animated sheen on active state */}
                                        {allDone && !superBoosterClaimed && (
                                            <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.3)_50%,transparent_60%)] animate-[shimmer_2s_infinite]" />
                                        )}
                                        <span className="relative z-10">
                                            {superBoosterClaimed ? '🎁 Super Booster récupéré ✓' : '🎁 Réclamer le Super Booster +300 XP'}
                                        </span>
                                    </motion.button>
                                    {!allDone && !superBoosterClaimed && (
                                        <p className="text-center text-[10px] text-white/20 mt-2">
                                            Complète les {DAILY_QUESTS.length} quêtes pour débloquer
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
