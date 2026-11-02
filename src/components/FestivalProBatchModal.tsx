import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Sparkles, CheckCircle2, Loader2, ChevronLeft, ChevronRight,
    LayoutGrid, Columns2, Check, Download, Zap, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { enhanceFestivalPhoto, type FestivalSceneMode } from '../utils/festivalPhotoEnhancer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchPhotoItem {
    id: string;
    file: File;
    originalPreview: string; // base64 ou ObjectURL de l'original
}

interface EnhancedResult {
    id: string;
    status: 'idle' | 'processing' | 'done' | 'error';
    enhancedUrl: string | null;
    mode: FestivalSceneMode | null;
    enabled: boolean; // l'utilisateur peut désactiver le filtre pour certaines photos
    error?: string;
}

interface FestivalProBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    photos: BatchPhotoItem[];
    /** Appelé avec les photos finales (originales ou améliorées selon choix utilisateur) */
    onConfirm: (results: { id: string; file: File; enhancedBlob: Blob | null; useEnhanced: boolean }[]) => void;
}

// ─── Constante de concurrence ─────────────────────────────────────────────────
const MAX_CONCURRENT = 2;

// ─── Composant principal ───────────────────────────────────────────────────────
export function FestivalProBatchModal({ isOpen, onClose, photos, onConfirm }: FestivalProBatchModalProps) {
    const [results, setResults] = useState<EnhancedResult[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'focus'>('grid');
    const [focusIndex, setFocusIndex] = useState(0);
    const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
    const [isProcessingAll, setIsProcessingAll] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const processingRef = useRef(false);
    const enhancedBlobsRef = useRef<Record<string, Blob | null>>({});

    // Initialise les résultats à chaque ouverture
    useEffect(() => {
        if (!isOpen || photos.length === 0) return;
        setResults(
            photos.map(p => ({
                id: p.id,
                status: 'idle',
                enhancedUrl: null,
                mode: null,
                enabled: true,
            }))
        );
        setShowOriginal({});
        setFocusIndex(0);
        enhancedBlobsRef.current = {};
        setProcessedCount(0);
    }, [isOpen, photos]);

    // ── Traitement batch avec queue de concurrence ─────────────────────────────
    const processAll = useCallback(async () => {
        if (processingRef.current) return;
        processingRef.current = true;
        setIsProcessingAll(true);
        setProcessedCount(0);

        // Seulement les photos encore "idle" ou "error"
        const toProcess = photos.filter(p => {
            const r = results.find(r => r.id === p.id);
            return !r || r.status === 'idle' || r.status === 'error';
        });

        let completed = 0;
        let idx = 0;

        const runNext = async () => {
            if (idx >= toProcess.length) return;
            const photo = toProcess[idx++];

            // Marque comme en cours
            setResults(prev => prev.map(r =>
                r.id === photo.id ? { ...r, status: 'processing', error: undefined } : r
            ));

            try {
                const res = await enhanceFestivalPhoto(photo.file, { maxDimension: 2048, quality: 0.92 });
                enhancedBlobsRef.current[photo.id] = res.blob;
                setResults(prev => prev.map(r =>
                    r.id === photo.id
                        ? { ...r, status: 'done', enhancedUrl: res.dataUrl, mode: res.mode }
                        : r
                ));
            } catch (err) {
                enhancedBlobsRef.current[photo.id] = null;
                setResults(prev => prev.map(r =>
                    r.id === photo.id
                        ? { ...r, status: 'error', error: 'Échec du traitement' }
                        : r
                ));
            }

            completed++;
            setProcessedCount(completed);
            await runNext();
        };

        // Lance MAX_CONCURRENT workers en parallèle
        const workers: Promise<void>[] = [];
        for (let w = 0; w < Math.min(MAX_CONCURRENT, toProcess.length); w++) {
            workers.push(runNext());
        }
        await Promise.all(workers);

        processingRef.current = false;
        setIsProcessingAll(false);
    }, [photos, results]);

    // ── Activer / désactiver le filtre par photo ───────────────────────────────
    const toggleEnabled = (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const enableAll = () => setResults(prev => prev.map(r => ({ ...r, enabled: true })));
    const disableAll = () => setResults(prev => prev.map(r => ({ ...r, enabled: false })));

    // ── Confirmation finale ────────────────────────────────────────────────────
    const handleConfirm = () => {
        const output = photos.map(p => {
            const r = results.find(r => r.id === p.id);
            const useEnhanced = !!r && r.enabled && r.status === 'done';
            return {
                id: p.id,
                file: p.file,
                enhancedBlob: useEnhanced ? (enhancedBlobsRef.current[p.id] ?? null) : null,
                useEnhanced,
            };
        });
        onConfirm(output);
    };

    const allDone = results.length > 0 && results.every(r => r.status === 'done' || r.status === 'error');
    const doneCount = results.filter(r => r.status === 'done').length;
    const totalRasters = photos.length;

    if (!isOpen) return null;

    const focusPhoto = photos[focusIndex];
    const focusResult = results.find(r => r.id === focusPhoto?.id);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="festival-batch-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                        className="relative w-full max-w-6xl max-h-[96vh] bg-[#0d0d0f] border border-amber-400/20 rounded-3xl shadow-[0_0_80px_rgba(251,191,36,0.12)] flex flex-col overflow-hidden"
                    >
                        {/* ── Header ─────────────────────────────────────────── */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-gradient-to-r from-amber-950/30 to-transparent shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-400/10 rounded-xl border border-amber-400/20">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-white">
                                        Festival Pro — Traitement Batch
                                    </h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                                        {totalRasters} photo{totalRasters > 1 ? 's' : ''} · {doneCount} traitée{doneCount > 1 ? 's' : ''}
                                        {isProcessingAll && ` · En cours (${processedCount}/${totalRasters})`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Toggle vue */}
                                <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-400/20 text-amber-400' : 'text-gray-500 hover:text-white'}`}
                                        title="Vue grille"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('focus')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'focus' ? 'bg-amber-400/20 text-amber-400' : 'text-gray-500 hover:text-white'}`}
                                        title="Vue focus avant/après"
                                    >
                                        <Columns2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* ── Barre d'actions ─────────────────────────────────── */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/2 shrink-0 gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={processAll}
                                    disabled={isProcessingAll || allDone}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                        ${isProcessingAll || allDone
                                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                                            : 'bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]'
                                        }`}
                                >
                                    {isProcessingAll ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Traitement...</>
                                    ) : allDone ? (
                                        <><CheckCircle2 className="w-3.5 h-3.5" /> Terminé</>
                                    ) : (
                                        <><Zap className="w-3.5 h-3.5" /> Tout améliorer</>
                                    )}
                                </button>

                                {allDone && (
                                    <button
                                        onClick={() => {
                                            setResults(prev => prev.map(r => ({ ...r, status: 'idle', enhancedUrl: null, mode: null })));
                                            enhancedBlobsRef.current = {};
                                            setProcessedCount(0);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Réinitialiser
                                    </button>
                                )}
                            </div>

                            {/* Sélection globale */}
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Filtre :</span>
                                <button onClick={enableAll} className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                                    Tout ON
                                </button>
                                <button onClick={disableAll} className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                                    Tout OFF
                                </button>
                            </div>
                        </div>

                        {/* ── Contenu principal ────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {viewMode === 'grid' ? (
                                // ─── VUE GRILLE ───────────────────────────────────
                                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {photos.map((photo, idx) => {
                                        const result = results.find(r => r.id === photo.id);
                                        const isShowingOriginal = showOriginal[photo.id];
                                        const displayUrl = !isShowingOriginal && result?.status === 'done' && result.enhancedUrl && result.enabled
                                            ? result.enhancedUrl
                                            : photo.originalPreview;

                                        return (
                                            <motion.div
                                                key={photo.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className={`relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group
                                                    ${result?.enabled ? 'border-amber-400/30' : 'border-white/10'}
                                                                `}
                                                onClick={() => { setFocusIndex(idx); setViewMode('focus'); }}
                                            >
                                                {/* Image */}
                                                <div className="aspect-square bg-black relative">
                                                    <img
                                                        src={displayUrl}
                                                        alt={photo.file.name}
                                                        className="w-full h-full object-cover"
                                                    />

                                                    {/* Overlay status */}
                                                    {result?.status === 'processing' && (
                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                                                            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                                                            <span className="text-[8px] font-black uppercase text-amber-300">Traitement...</span>
                                                        </div>
                                                    )}

                                                    {/* Badge mode */}
                                                    {result?.status === 'done' && result.enabled && (
                                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-black/80 backdrop-blur border border-amber-400/40 flex items-center gap-1">
                                                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                                            <span className="text-[7px] font-black uppercase text-amber-300">
                                                                {result.mode === 'NIGHT_INDOOR' ? 'Nuit' : 'Jour'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Numéro */}
                                                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center">
                                                        <span className="text-[8px] font-black text-white">{idx + 1}</span>
                                                    </div>

                                                    {/* Hover: voir avant/après */}
                                                    {result?.status === 'done' && result.enabled && (
                                                        <button
                                                            onMouseDown={() => setShowOriginal(prev => ({ ...prev, [photo.id]: true }))}
                                                            onMouseUp={() => setShowOriginal(prev => ({ ...prev, [photo.id]: false }))}
                                                            onMouseLeave={() => setShowOriginal(prev => ({ ...prev, [photo.id]: false }))}
                                                            onTouchStart={() => setShowOriginal(prev => ({ ...prev, [photo.id]: true }))}
                                                            onTouchEnd={() => setShowOriginal(prev => ({ ...prev, [photo.id]: false }))}
                                                            onClick={e => e.stopPropagation()}
                                                            className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-all px-1.5 py-0.5 rounded-lg bg-black/80 text-[7px] font-black uppercase text-gray-300 border border-white/10"
                                                        >
                                                            {isShowingOriginal ? '● Original' : 'Comparer'}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Footer carte */}
                                                <div className="px-2 py-1.5 bg-black/80 flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
                                                    <span className="text-[7px] font-bold text-gray-500 truncate max-w-[70%]">{photo.file.name}</span>
                                                    {result?.status === 'done' ? (
                                                        <button
                                                            onClick={() => toggleEnabled(photo.id)}
                                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase transition-all border ${
                                                                result.enabled
                                                                    ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                                                                    : 'bg-white/5 text-gray-500 border-white/10'
                                                            }`}
                                                        >
                                                            {result.enabled ? <><Check className="w-2 h-2" /> Pro</> : <><EyeOff className="w-2 h-2" /> OFF</>}
                                                        </button>
                                                    ) : result?.status === 'error' ? (
                                                        <span className="text-[7px] font-black uppercase text-red-400">Erreur</span>
                                                    ) : result?.status === 'processing' ? (
                                                        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                                                    ) : (
                                                        <span className="text-[7px] font-black uppercase text-gray-600">En attente</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // ─── VUE FOCUS AVANT/APRÈS ─────────────────────────
                                <div className="flex flex-col h-full">
                                    {focusPhoto && focusResult && (
                                        <div className="flex-1 flex flex-col p-4 gap-4 min-h-0">
                                            {/* Navigation */}
                                            <div className="flex items-center justify-between shrink-0">
                                                <button
                                                    onClick={() => setFocusIndex(i => Math.max(0, i - 1))}
                                                    disabled={focusIndex === 0}
                                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                        {focusIndex + 1} / {photos.length}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 max-w-[200px] truncate">{focusPhoto.file.name}</span>
                                                </div>

                                                <button
                                                    onClick={() => setFocusIndex(i => Math.min(photos.length - 1, i + 1))}
                                                    disabled={focusIndex === photos.length - 1}
                                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Panneau Avant / Après côte à côte */}
                                            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                                                {/* AVANT */}
                                                <div className="relative flex flex-col gap-2">
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center">
                                                        ● Original
                                                    </div>
                                                    <div className="flex-1 relative bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center min-h-0">
                                                        <img
                                                            src={focusPhoto.originalPreview}
                                                            alt="Original"
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                </div>

                                                {/* APRÈS */}
                                                <div className="relative flex flex-col gap-2">
                                                    <div className={`text-[9px] font-black uppercase tracking-widest text-center ${focusResult.enabled ? 'text-amber-400' : 'text-gray-500'}`}>
                                                        ✦ Festival Pro
                                                        {focusResult.mode && focusResult.status === 'done' && (
                                                            <span className="ml-1 text-gray-500">
                                                                ({focusResult.mode === 'NIGHT_INDOOR' ? 'Nuit/Indoor' : 'Jour/Outdoor'})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`flex-1 relative bg-black rounded-2xl overflow-hidden border flex items-center justify-center min-h-0 transition-all ${focusResult.enabled ? 'border-amber-400/30' : 'border-white/10 opacity-50'}`}>
                                                        {focusResult.status === 'processing' && (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-black/60">
                                                                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                                                                <span className="text-[9px] font-black uppercase text-amber-300 tracking-widest">Traitement Pro...</span>
                                                            </div>
                                                        )}
                                                        {focusResult.status === 'done' && focusResult.enhancedUrl ? (
                                                            <img
                                                                src={focusResult.enhancedUrl}
                                                                alt="Festival Pro"
                                                                className="max-w-full max-h-full object-contain"
                                                            />
                                                        ) : focusResult.status === 'idle' ? (
                                                            <div className="flex flex-col items-center gap-2 text-center p-4">
                                                                <Sparkles className="w-8 h-8 text-amber-400/40" />
                                                                <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">
                                                                    Lance "Tout améliorer" pour voir le résultat
                                                                </span>
                                                            </div>
                                                        ) : focusResult.status === 'error' ? (
                                                            <div className="flex flex-col items-center gap-2 text-center p-4">
                                                                <span className="text-[9px] font-black uppercase text-red-400">Échec traitement</span>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Toggle ON/OFF filtre pour cette photo */}
                                            {focusResult.status === 'done' && (
                                                <div className="shrink-0 flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => toggleEnabled(focusPhoto.id)}
                                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                            focusResult.enabled
                                                                ? 'bg-amber-400/15 text-amber-300 border-amber-400/30 hover:bg-amber-400/25'
                                                                : 'bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {focusResult.enabled ? (
                                                            <><Check className="w-3.5 h-3.5" /> Filtre activé pour cette photo</>
                                                        ) : (
                                                            <><EyeOff className="w-3.5 h-3.5" /> Filtre désactivé (original)</>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Miniatures en bas */}
                                    <div className="shrink-0 border-t border-white/8 px-4 py-3">
                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                            {photos.map((photo, idx) => {
                                                const r = results.find(r => r.id === photo.id);
                                                return (
                                                    <button
                                                        key={photo.id}
                                                        onClick={() => setFocusIndex(idx)}
                                                        className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                                                            focusIndex === idx ? 'border-amber-400 scale-110 shadow-md shadow-amber-400/30' : 'border-white/10 opacity-50 hover:opacity-80'
                                                        }`}
                                                    >
                                                        <img src={photo.originalPreview} alt="" className="w-full h-full object-cover" />
                                                        {r?.status === 'done' && r.enabled && (
                                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-amber-400 rounded-tl flex items-center justify-center">
                                                                <Check className="w-2 h-2 text-black" />
                                                            </div>
                                                        )}
                                                        {r?.status === 'processing' && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Footer confirmation ──────────────────────────────── */}
                        <div className="shrink-0 border-t border-white/8 px-6 py-4 flex items-center justify-between gap-4 bg-black/40">
                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                {results.filter(r => r.enabled && r.status === 'done').length} photo{results.filter(r => r.enabled && r.status === 'done').length > 1 ? 's' : ''} avec filtre Pro
                                · {results.filter(r => !r.enabled || r.status !== 'done').length} original{results.filter(r => !r.enabled || r.status !== 'done').length > 1 ? 'es' : ''}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isProcessingAll}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                                        isProcessingAll
                                            ? 'bg-white/10 text-gray-600 cursor-not-allowed'
                                            : 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-400/30 hover:shadow-amber-400/50'
                                    }`}
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Valider & Uploader
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
