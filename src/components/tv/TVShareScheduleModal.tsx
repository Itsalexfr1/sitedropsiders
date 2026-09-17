import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Download, 
    Share2, 
    Copy, 
    Check, 
    Tv, 
    Clock, 
    Sparkles, 
    Radio, 
    Smartphone, 
    Palette, 
    Loader2,
    Calendar,
    Flame
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import type { TVScheduleBlock, PromoVideo, ComputedScheduleItem } from '../../utils/tvSchedule';
import { computeDaySchedule } from '../../utils/tvSchedule';
import { useNavigate } from 'react-router-dom';

interface TVShareScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    tvBlocks: TVScheduleBlock[];
    durationsMap: Record<string, number>;
    promos?: PromoVideo[];
}

export function TVShareScheduleModal({
    isOpen,
    onClose,
    tvBlocks,
    durationsMap,
    promos = []
}: TVShareScheduleModalProps) {
    const navigate = useNavigate();
    const cardRef = useRef<HTMLDivElement>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedText, setCopiedText] = useState(false);
    const [filterMode, setFilterMode] = useState<'all' | 'evening' | 'highlight'>('all');
    const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story'); // 9:16 or 1:1

    // Calcul de la date du jour en français
    const todayFormatted = useMemo(() => {
        const now = new Date();
        return now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).toUpperCase();
    }, []);

    // Calcul des sets du jour avec leurs vraies durées et horaires exacts
    const scheduleItems = useMemo(() => {
        return computeDaySchedule(tvBlocks, durationsMap, promos);
    }, [tvBlocks, durationsMap, promos]);

    // Filtrage pour la mise en page de la Story (afin que le visuel reste lisible et percutant)
    const displayItems = useMemo(() => {
        if (filterMode === 'evening') {
            // Soirée à partir de 18h
            const evening = scheduleItems.filter(item => {
                const hour = parseInt(item.startTime.split('h')[0], 10);
                return hour >= 18 || hour < 6;
            });
            return evening.length > 0 ? evening.slice(0, 6) : scheduleItems.slice(0, 6);
        }
        if (filterMode === 'highlight') {
            // Sélection des sets les plus longs / têtes d'affiche
            const sortedByDur = [...scheduleItems].sort((a, b) => b.durationSeconds - a.durationSeconds);
            const top = sortedByDur.slice(0, 5).sort((a, b) => a.startSecondsFromMidnight - b.startSecondsFromMidnight);
            return top.length > 0 ? top : scheduleItems.slice(0, 6);
        }
        // Tous les sets ou les 6 prochains si la journée est chargée
        return scheduleItems.slice(0, 6);
    }, [scheduleItems, filterMode]);

    // Génération du texte à copier/partager
    const shareText = useMemo(() => {
        const lines = displayItems.map(
            item => `• ${item.startTime} : ${item.artist} (${item.durationFormatted})${item.isCurrentlyLive ? ' 🔴 EN DIRECT' : ''}`
        );
        return `🔥 AUJOURD'HUI SUR DROPSIDERS TV (${todayFormatted}) :\n\n${lines.join('\n')}\n\n👉 Regarde en direct gratuitement sur https://dropsiders.com/tv`;
    }, [displayItems, todayFormatted]);

    // Copier le texte
    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2500);
        } catch {
            // Fallback
        }
    };

    // Télécharger l'image PNG haute résolution (1080x1920 pour story 9:16)
    const handleDownloadImage = async () => {
        if (!cardRef.current || isGenerating) return;
        setIsGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 3,
                quality: 1,
                cacheBust: true,
                style: {
                    transform: 'none',
                    borderRadius: '0px'
                }
            });

            const link = document.createElement('a');
            const cleanDate = new Date().toISOString().slice(0, 10);
            link.download = `dropsiders-tv-programme-${cleanDate}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Erreur export image:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    // Partage natif mobile (WhatsApp, Instagram, Telegram...)
    const handleNativeShare = async () => {
        if (!cardRef.current || isGenerating) return;
        setIsGenerating(true);

        try {
            // Essai de génération de blob pour partage direct de l'image
            const blob = await toBlob(cardRef.current, {
                pixelRatio: 2,
                quality: 0.95,
                cacheBust: true
            });

            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'programme.png', { type: 'image/png' })] })) {
                const file = new File([blob], 'dropsiders-programme-tv.png', { type: 'image/png' });
                await navigator.share({
                    title: 'Programme du jour · Dropsiders TV',
                    text: shareText,
                    files: [file]
                });
                setIsGenerating(false);
                return;
            }

            // Fallback: Partage natif texte + lien
            if (navigator.share) {
                await navigator.share({
                    title: 'Programme du jour · Dropsiders TV',
                    text: shareText,
                    url: 'https://dropsiders.com/tv'
                });
            } else {
                // Fallback presse-papier si non supporté
                handleCopyText();
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                console.error('Erreur partage:', err);
                handleCopyText();
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Passerelle vers Social Studio
    const handleOpenInSocialStudio = () => {
        try {
            const planningPayload = {
                title: `AUJOURD'HUI SUR DROPSIDERS TV`,
                date: todayFormatted,
                items: displayItems.map(item => ({
                    time: item.startTime,
                    artist: `${item.artist} (${item.durationFormatted})`
                }))
            };
            localStorage.setItem('dropsiders_custom_planning_import', JSON.stringify(planningPayload));
        } catch {}
        navigate('/social-studio');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[#0b0b0f] border border-white/10 rounded-[2.5rem] w-full max-w-5xl shadow-[0_0_80px_rgba(255,18,65,0.15)] flex flex-col max-h-[92vh] overflow-hidden my-auto"
                >
                    {/* Top Bar Modal */}
                    <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-neon-red/20 via-neon-purple/20 to-neon-cyan/20 border border-white/10 shadow-lg">
                                <Sparkles className="w-5 h-5 text-neon-red animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-white font-display font-black text-lg sm:text-xl uppercase italic tracking-tight">
                                        Partager le programme <span className="text-neon-red">TV</span>
                                    </h2>
                                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-[9px] font-black text-neon-cyan uppercase tracking-wider">
                                        Vraies durées
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs font-semibold">
                                    Génère le visuel officiel du jour avec les horaires et durées réels des sets
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Content : 2 Columns (Preview & Controls) */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start custom-scrollbar">
                        
                        {/* Colonne Gauche : Aperçu Carte Story (9:16) */}
                        <div className="lg:col-span-6 flex flex-col items-center justify-center">
                            <div className="w-full flex items-center justify-between mb-3 px-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 flex items-center gap-1.5">
                                    <Smartphone className="w-3.5 h-3.5 text-neon-cyan" />
                                    Aperçu Visuel {aspectRatio === 'story' ? 'Story (9:16)' : 'Carré (1:1)'}
                                </span>
                                <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                                    <button
                                        onClick={() => setAspectRatio('story')}
                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                            aspectRatio === 'story'
                                                ? 'bg-neon-red text-white shadow-md'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        9:16
                                    </button>
                                    <button
                                        onClick={() => setAspectRatio('square')}
                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                            aspectRatio === 'square'
                                                ? 'bg-neon-red text-white shadow-md'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        1:1
                                    </button>
                                </div>
                            </div>

                            {/* Conteneur de rendu exportable */}
                            <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden border border-white/20">
                                <div
                                    ref={cardRef}
                                    style={{
                                        width: aspectRatio === 'story' ? '340px' : '340px',
                                        height: aspectRatio === 'story' ? '604px' : '340px'
                                    }}
                                    className="bg-gradient-to-b from-[#09090d] via-[#0d0714] to-[#050508] p-5 flex flex-col justify-between relative select-none overflow-hidden"
                                >
                                    {/* Gradients luminescents d'ambiance */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-neon-red/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-purple/20 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />

                                    {/* Header de la carte */}
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-xl bg-neon-red/20 border border-neon-red/40 flex items-center justify-center shadow-[0_0_12px_rgba(255,18,65,0.4)]">
                                                    <Tv className="w-3.5 h-3.5 text-neon-red" />
                                                </div>
                                                <div>
                                                    <div className="text-white font-display font-black text-xs uppercase tracking-tight leading-none">
                                                        DROPSIDERS <span className="text-neon-red">TV</span>
                                                    </div>
                                                    <div className="text-[7px] font-black uppercase tracking-[0.25em] text-neon-cyan mt-0.5">
                                                        WEB TV ÉLECTRO 24/7
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-red/20 border border-neon-red/40 text-neon-red text-[8px] font-black uppercase tracking-wider animate-pulse">
                                                <Radio className="w-2.5 h-2.5" />
                                                <span>DIRECT</span>
                                            </div>
                                        </div>

                                        <div className="text-center my-1.5">
                                            <div className="inline-block px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-[8px] font-black uppercase tracking-[0.25em] text-white/90 mb-1">
                                                PROGRAMME DU JOUR
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                {todayFormatted}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Liste des Sets avec Horaires et Vraies Durées */}
                                    <div className="relative z-10 flex-1 my-2 flex flex-col justify-center gap-2 overflow-hidden">
                                        {displayItems.map((item, idx) => (
                                            <div
                                                key={item.id || idx}
                                                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                                                    item.isCurrentlyLive
                                                        ? 'bg-neon-red/15 border-neon-red/50 shadow-[0_0_20px_rgba(255,18,65,0.25)]'
                                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {/* Heure et badge */}
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                                    <div className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-black/60 border border-white/15 min-w-[48px]">
                                                        <span className="text-[10px] font-black text-white font-mono tracking-tight leading-none">
                                                            {item.startTime}
                                                        </span>
                                                        <span className="text-[7px] font-bold text-gray-400 uppercase mt-0.5">
                                                            DÉBUT
                                                        </span>
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[11px] font-black text-white uppercase italic tracking-tight truncate">
                                                                {item.artist}
                                                            </span>
                                                            {item.isCurrentlyLive && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neon-red text-white text-[7px] font-black uppercase tracking-wider animate-pulse shrink-0">
                                                                    <span className="w-1 h-1 rounded-full bg-white" />
                                                                    LIVE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider truncate">
                                                            {item.event}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Vraie durée du set */}
                                                <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 border border-white/15 text-white/90">
                                                    <Clock className="w-2.5 h-2.5 text-neon-cyan" />
                                                    <span className="text-[9px] font-black font-mono tracking-tight text-white">
                                                        {item.durationFormatted}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer de la carte */}
                                    <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-center">
                                        <div className="text-left">
                                            <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                À REGARDER EN DIRECT SUR
                                            </div>
                                            <div className="text-[10px] font-black text-white tracking-tight font-mono">
                                                DROPSIDERS.<span className="text-neon-red">COM/TV</span>
                                            </div>
                                        </div>

                                        <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-neon-cyan">
                                            @DROPSIDERS
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Colonne Droite : Filtres et Actions */}
                        <div className="lg:col-span-6 flex flex-col gap-6">
                            
                            {/* Filtres de sélection */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                    <Palette className="w-3.5 h-3.5 text-neon-red" />
                                    Personnaliser la sélection
                                </h3>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setFilterMode('all')}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                            filterMode === 'all'
                                                ? 'bg-neon-red/20 border-neon-red text-white shadow-lg'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Calendar className="w-4 h-4 mx-auto mb-1 text-neon-red" />
                                        <div className="text-[10px] font-black uppercase">Journée</div>
                                        <div className="text-[8px] text-gray-500 font-semibold">Tous les blocs</div>
                                    </button>

                                    <button
                                        onClick={() => setFilterMode('evening')}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                            filterMode === 'evening'
                                                ? 'bg-neon-purple/20 border-neon-purple text-white shadow-lg'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Radio className="w-4 h-4 mx-auto mb-1 text-neon-purple" />
                                        <div className="text-[10px] font-black uppercase">Soirée</div>
                                        <div className="text-[8px] text-gray-500 font-semibold">18h à 06h</div>
                                    </button>

                                    <button
                                        onClick={() => setFilterMode('highlight')}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                            filterMode === 'highlight'
                                                ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-lg'
                                                : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        <Flame className="w-4 h-4 mx-auto mb-1 text-neon-cyan" />
                                        <div className="text-[10px] font-black uppercase">Top Sets</div>
                                        <div className="text-[8px] text-gray-500 font-semibold">Plus longs sets</div>
                                    </button>
                                </div>
                            </div>

                            {/* Résumé textuel */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Texte à envoyer à tes potes
                                    </span>
                                    <button
                                        onClick={handleCopyText}
                                        className="text-[9px] font-black uppercase tracking-widest text-neon-cyan hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        {copiedText ? (
                                            <>
                                                <Check className="w-3 h-3 text-neon-green" />
                                                <span className="text-neon-green">Copié !</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                Copier
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="p-3 bg-black/60 rounded-2xl border border-white/10 text-gray-300 text-xs font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                                    {shareText}
                                </div>
                            </div>

                            {/* Boutons d'Action Principaux */}
                            <div className="space-y-3 pt-2">
                                {/* Bouton Partage Mobile Natif */}
                                <button
                                    onClick={handleNativeShare}
                                    disabled={isGenerating}
                                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Share2 className="w-4 h-4" />
                                    )}
                                    <span>Partager à un pote (WhatsApp / Insta)</span>
                                </button>

                                {/* Bouton Télécharger l'image Story */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={handleDownloadImage}
                                        disabled={isGenerating}
                                        className="py-3.5 px-4 rounded-2xl bg-white text-black hover:bg-neon-cyan hover:text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Télécharger la Story</span>
                                    </button>

                                    <button
                                        onClick={handleCopyText}
                                        className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                    >
                                        {copiedText ? (
                                            <Check className="w-4 h-4 text-neon-green" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                        <span>{copiedText ? 'Copié dans le presse-papier' : 'Copier le texte'}</span>
                                    </button>
                                </div>

                                {/* Passerelle Social Studio */}
                                <button
                                    onClick={handleOpenInSocialStudio}
                                    className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-neon-purple/20 border border-white/10 hover:border-neon-purple/40 text-gray-400 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                                    <span>Personnaliser dans le Social Studio</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
