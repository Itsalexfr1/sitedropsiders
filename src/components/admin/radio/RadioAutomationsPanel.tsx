import { useState } from 'react';
import {
    Clock,
    Sliders,
    Play,
    Pause,
    Check,
    AlertTriangle,
    Shuffle,
    Save,
    Sparkles,
    Trash2,
    FileAudio,
    Search
} from 'lucide-react';
import {
    type RadioTopHoraireConfig,
    type RadioScheduleBlock
} from '../../../utils/radioSchedule';
import { type RadionomyItem } from '../modals/RadionomyJinglesBox';

interface RadioAutomationsPanelProps {
    topHoraireConfig: RadioTopHoraireConfig;
    onUpdateTopHoraire: (config: RadioTopHoraireConfig) => void;
    blocks: RadioScheduleBlock[];
    selectedBlockId: string | null;
    onApplyRadionomyRule: (pubEveryN: number, jingleEveryN: number) => void;
    onResetGrid: () => void;
    onOpenDuplicateAudit: () => void;
    playingAudioId: string | null;
    onToggleAudioPreview: (id: string, url: string) => void;
}

export function RadioAutomationsPanel({
    topHoraireConfig,
    onUpdateTopHoraire,
    blocks,
    selectedBlockId,
    onApplyRadionomyRule,
    onResetGrid,
    onOpenDuplicateAudit,
    playingAudioId,
    onToggleAudioPreview
}: RadioAutomationsPanelProps) {
    // État local pour le Top Horaire
    const [thEnabled, setThEnabled] = useState(topHoraireConfig.enabled);
    const [thTitle, setThTitle] = useState(topHoraireConfig.title || '');
    const [thDuration, setThDuration] = useState(String(topHoraireConfig.duration || 10));
    const [thAudioUrl, setThAudioUrl] = useState(topHoraireConfig.audioUrl || '');
    const [thYoutubeId, setThYoutubeId] = useState(topHoraireConfig.youtubeId || '');

    // États règle d'horloge
    const [jingleFrequency, setJingleFrequency] = useState(1);
    const [pubFrequency, setPubFrequency] = useState(2);
    const [ruleSuccessMsg, setRuleSuccessMsg] = useState<string | null>(null);

    const handleSaveTopHoraire = () => {
        const dur = Math.max(1, Math.min(120, parseInt(thDuration, 10) || 10));
        onUpdateTopHoraire({
            enabled: thEnabled,
            title: thTitle.trim() || 'Dropsiders Radio • Top Horaire Officiel',
            duration: dur,
            audioUrl: thAudioUrl.trim() || undefined,
            youtubeId: thYoutubeId.trim() || undefined
        });
    };

    const handleRunRule = () => {
        onApplyRadionomyRule(pubFrequency, jingleFrequency);
        setRuleSuccessMsg('✓ Règle d\'insertion appliquée avec succès !');
        setTimeout(() => setRuleSuccessMsg(null), 3000);
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    return (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto space-y-6">
            {/* ── 1. CONFIGURATION DU TOP HORAIRE ── */}
            <div className="p-6 rounded-3xl bg-[#0d0e17] border border-white/10 shadow-xl relative overflow-hidden space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-display font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                ⏰ TOP HORAIRE OFFICIEL
                                <span className="text-[9px] font-mono not-italic px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                    Début d'heure (XXh00)
                                </span>
                            </h3>
                            <p className="text-xs text-gray-400 font-sans">
                                Déclenchement automatique prioritaire à la première seconde de chaque heure.
                            </p>
                        </div>
                    </div>

                    {/* Toggle ON/OFF */}
                    <button
                        type="button"
                        onClick={() => setThEnabled(!thEnabled)}
                        className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase italic tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                            thEnabled
                                ? 'bg-neon-cyan text-black border-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                                : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${thEnabled ? 'bg-black animate-ping' : 'bg-gray-500'}`} />
                        <span>{thEnabled ? 'ACTIVÉ (PRIORITAIRE)' : 'DÉSACTIVÉ'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Titre */}
                    <div>
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                            Titre affiché à l'antenne
                        </label>
                        <input
                            type="text"
                            value={thTitle}
                            onChange={e => setThTitle(e.target.value)}
                            placeholder="Dropsiders Radio • Top Horaire Officiel"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-neon-cyan"
                        />
                    </div>

                    {/* Durée en secondes */}
                    <div>
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                            Durée exacte du jingle (en secondes)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={thDuration}
                                onChange={e => setThDuration(e.target.value)}
                                className="w-24 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-neon-cyan text-center"
                            />
                            <span className="text-xs text-gray-400 font-mono">secondes</span>
                            {thAudioUrl && (
                                <button
                                    type="button"
                                    onClick={() => onToggleAudioPreview('th_preview', thAudioUrl)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                        playingAudioId === 'th_preview'
                                            ? 'bg-neon-cyan text-black'
                                            : 'bg-white/10 hover:bg-white/20 text-gray-300'
                                    }`}
                                >
                                    {playingAudioId === 'th_preview' ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                    <span>Écouter</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Fichier Audio WAV / MP3 */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                            URL du fichier audio (MP3 ou WAV)
                        </label>
                        <input
                            type="text"
                            value={thAudioUrl}
                            onChange={e => setThAudioUrl(e.target.value)}
                            placeholder="https://.../Dropsiders_Radio_Top_Horaire.wav"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-neon-cyan"
                        />
                        <p className="text-[9px] text-gray-500 font-sans mt-1">
                            💡 Vous pouvez copier l'URL d'un Top Horaire uploadé depuis l'onglet Médiathèque.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={handleSaveTopHoraire}
                        className="px-5 py-2.5 rounded-xl bg-neon-cyan text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
                    >
                        <Check className="w-4 h-4" />
                        <span>Enregistrer les réglages Top Horaire</span>
                    </button>
                </div>
            </div>

            {/* ── 2. RÈGLE HORLOGE (AUTO-JINGLE & AUTO-PUB) ── */}
            <div className="p-6 rounded-3xl bg-[#0d0e17] border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center gap-3.5 pb-3 border-b border-white/10">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-display font-black text-white uppercase italic tracking-tight">
                            ⚙️ RÈGLE HORLOGE AUTOMATIQUE (RADIONOMY ENGINE)
                        </h3>
                        <p className="text-xs text-gray-400 font-sans">
                            Insérez automatiquement des jingles et des spots publicitaires à intervalles réguliers.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {/* Fréquence Jingles */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <label className="text-xs font-display font-black text-amber-300 uppercase italic flex items-center gap-1.5">
                            <span>🔔 Insérer un jingle :</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">Tous les</span>
                            <select
                                value={jingleFrequency}
                                onChange={e => setJingleFrequency(Number(e.target.value))}
                                className="bg-[#141624] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                            >
                                <option value={1}>1 set (après chaque set - recommandé)</option>
                                <option value={2}>2 sets / morceaux</option>
                                <option value={3}>3 sets / morceaux</option>
                                <option value={4}>4 sets / morceaux</option>
                                <option value={0}>Désactivé</option>
                            </select>
                        </div>
                    </div>

                    {/* Fréquence Pubs */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <label className="text-xs font-display font-black text-pink-300 uppercase italic flex items-center gap-1.5">
                            <span>📢 Insérer un spot pub / promo :</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">Tous les</span>
                            <select
                                value={pubFrequency}
                                onChange={e => setPubFrequency(Number(e.target.value))}
                                className="bg-[#141624] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-400"
                            >
                                <option value={1}>1 set (toutes les heures)</option>
                                <option value={2}>2 sets (toutes les 2h - recommandé)</option>
                                <option value={3}>3 sets</option>
                                <option value={4}>4 sets</option>
                                <option value={0}>Désactivé</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <p className="text-[10px] text-gray-400 font-sans">
                        Cible : {selectedBlock ? <strong className="text-neon-cyan">Émission « {selectedBlock.title} »</strong> : 'Sélectionnez une émission d\'abord'}
                    </p>

                    <div className="flex items-center gap-3">
                        {ruleSuccessMsg && (
                            <span className="text-xs text-emerald-400 font-bold animate-pulse">
                                {ruleSuccessMsg}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleRunRule}
                            disabled={!selectedBlock}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase italic tracking-wider flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-amber-500/20"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Appliquer la règle à l'émission</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── 3. OUTILS DE MAINTENANCE & AUDIT ── */}
            <div className="p-6 rounded-3xl bg-[#0d0e17] border border-white/10 shadow-xl space-y-4">
                <h4 className="text-sm font-display font-black text-white uppercase italic tracking-wider">
                    🛠️ Outils de Maintenance & Synchronisation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Détection des doublons */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-3">
                        <div>
                            <p className="text-xs font-display font-black uppercase italic text-gray-200">
                                Audit des doublons
                            </p>
                            <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                                Analyse toutes les émissions pour repérer les pistes ou vidéos dupliquées.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onOpenDuplicateAudit}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-display font-black uppercase italic tracking-wider border border-white/10 transition-all cursor-pointer"
                        >
                            Lancer l'audit des doublons
                        </button>
                    </div>

                    {/* Réinitialisation de la grille */}
                    <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 flex flex-col justify-between space-y-3">
                        <div>
                            <p className="text-xs font-display font-black uppercase italic text-red-300">
                                Réinitialiser la grille
                            </p>
                            <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                                Remet à zéro toutes les émissions avec les réglages d'usine par défaut.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onResetGrid}
                            className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500 text-red-200 hover:text-black text-xs font-display font-black uppercase italic tracking-wider border border-red-500/30 transition-all cursor-pointer"
                        >
                            Réinitialiser la grille d'antenne
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
