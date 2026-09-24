import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, X, Zap } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DuplicateEntry {
    youtubeId: string;
    title: string;
    occurrences: { blockId: string; blockTitle: string; blockEmoji?: string; blockColor?: string }[];
}

interface DuplicateAuditModalProps {
    isOpen: boolean;
    mode: 'radio' | 'tv';
    duplicates: DuplicateEntry[];
    onResolve: (youtubeId: string, keepBlockId: string, removeFromBlockIds: string[]) => void;
    onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DuplicateAuditModal({
    isOpen,
    mode,
    duplicates,
    onResolve,
    onClose,
}: DuplicateAuditModalProps) {
    if (!isOpen || duplicates.length === 0) return null;

    const label = mode === 'radio' ? 'émission' : 'bloc TV';
    const labelPl = mode === 'radio' ? 'émissions' : 'blocs TV';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 20 }}
                    className="bg-[#07080c] border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.15)] relative"
                >
                    {/* Neon top bar */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />

                    {/* Header */}
                    <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-black/40 shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                <span className="text-amber-400">⚠️ AUDIT DOUBLONS</span>
                                <span className="text-[10px] font-mono normal-case not-italic text-gray-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                    {duplicates.length} set{duplicates.length > 1 ? 's' : ''} en doublon
                                </span>
                            </h2>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                Ces sets apparaissent dans plusieurs {labelPl} simultanément — choisissez où garder chaque set.
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-xl transition-colors cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Duplicate list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {duplicates.map((dup) => (
                            <div key={dup.youtubeId} className="bg-[#0c0d18] border border-amber-500/20 rounded-2xl p-4 space-y-3">
                                {/* Video info */}
                                <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                        <img
                                            src={`https://img.youtube.com/vi/${dup.youtubeId}/default.jpg`}
                                            alt=""
                                            className="w-16 h-11 rounded-xl object-cover bg-black border border-white/10"
                                        />
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 border-2 border-[#07080c] flex items-center justify-center text-[8px] font-black text-black">
                                            {dup.occurrences.length}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-display font-black text-white italic uppercase truncate leading-tight">
                                            {dup.title || dup.youtubeId}
                                        </p>
                                        <p className="text-[9px] font-mono text-amber-400 mt-0.5">
                                            Présent dans {dup.occurrences.length} {label}{dup.occurrences.length > 1 ? 's' : ''} simultanément
                                        </p>
                                    </div>
                                    <a href={`https://www.youtube.com/watch?v=${dup.youtubeId}`} target="_blank" rel="noreferrer" className="shrink-0 text-gray-600 hover:text-white transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </a>
                                </div>

                                {/* Block choices */}
                                <div className="space-y-1.5">
                                    <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest px-0.5">
                                        → Garder dans quelle {label} ? (les autres seront retirés)
                                    </p>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {dup.occurrences.map((occ) => (
                                            <button
                                                key={occ.blockId}
                                                type="button"
                                                onClick={() => {
                                                    const removeFrom = dup.occurrences
                                                        .filter(o => o.blockId !== occ.blockId)
                                                        .map(o => o.blockId);
                                                    onResolve(dup.youtubeId, occ.blockId, removeFrom);
                                                }}
                                                className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-emerald-500/15 hover:border-emerald-500/40 transition-all group cursor-pointer"
                                            >
                                                {occ.blockEmoji && <span className="text-sm shrink-0">{occ.blockEmoji}</span>}
                                                {occ.blockColor && (
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: occ.blockColor }} />
                                                )}
                                                <span className="text-[10px] font-display font-black text-gray-300 group-hover:text-white uppercase italic tracking-wider transition-colors flex-1 truncate">
                                                    {occ.blockTitle}
                                                </span>
                                                <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3.5 border-t border-white/10 bg-black/30 shrink-0 flex items-center justify-between gap-3">
                        <p className="text-[9px] font-mono text-gray-500 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                            Cliquez sur une {label} pour y garder le set — il sera retiré des autres automatiquement.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-display font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Fermer l'audit
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export interface RadioBlockLike {
    id: string;
    title: string;
    emoji?: string;
    color?: string;
    tracks?: { youtubeId?: string; title?: string; artist?: string }[];
}

export interface TVBlockLike {
    id: string;
    title: string;
    name?: string;
    emoji?: string;
    color?: string;
    videos?: { youtubeId?: string; title?: string }[];
}

export function detectRadioDuplicates(blocks: RadioBlockLike[]): DuplicateEntry[] {
    const map = new Map<string, DuplicateEntry>();
    blocks.forEach(b => {
        (b.tracks || []).forEach(t => {
            if (!t.youtubeId) return;
            const occ = { blockId: b.id, blockTitle: b.title, blockEmoji: b.emoji, blockColor: b.color };
            const existing = map.get(t.youtubeId);
            if (existing) {
                if (!existing.occurrences.find(o => o.blockId === b.id)) existing.occurrences.push(occ);
            } else {
                map.set(t.youtubeId, {
                    youtubeId: t.youtubeId,
                    title: t.artist ? `${t.artist} - ${t.title || t.youtubeId}` : (t.title || t.youtubeId),
                    occurrences: [occ],
                });
            }
        });
    });
    return Array.from(map.values()).filter(e => e.occurrences.length > 1);
}

export function detectTVDuplicates(blocks: TVBlockLike[]): DuplicateEntry[] {
    const map = new Map<string, DuplicateEntry>();
    blocks.forEach(b => {
        (b.videos || []).forEach(v => {
            if (!v.youtubeId) return;
            const occ = { blockId: b.id, blockTitle: b.title || b.name || 'Bloc', blockEmoji: b.emoji, blockColor: b.color };
            const existing = map.get(v.youtubeId);
            if (existing) {
                if (!existing.occurrences.find(o => o.blockId === b.id)) existing.occurrences.push(occ);
            } else {
                map.set(v.youtubeId, {
                    youtubeId: v.youtubeId,
                    title: v.title || v.youtubeId,
                    occurrences: [occ],
                });
            }
        });
    });
    return Array.from(map.values()).filter(e => e.occurrences.length > 1);
}
