import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShieldAlert, RefreshCw, HardDrive, 
    AlertTriangle, FileSearch,
    Loader2
} from 'lucide-react';

interface ScanMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Broken Images
    isScanningBroken: boolean;
    onScanBroken: () => void;
    brokenCount: number;
    // Unused Images
    isScanningUnused: boolean;
    onScanUnused: () => void;
    unusedCount: number;
    // Duplicates
    isScanningDuplicates: boolean;
    onScanDuplicates: () => void;
    duplicateCount: number;
    // Clean Encoding
    isCleaningEncoding: boolean;
    onCleanEncoding: () => void;
}

export function ScanMenuModal({
    isOpen,
    onClose,
    isScanningBroken,
    onScanBroken,
    brokenCount,
    isScanningUnused,
    onScanUnused,
    unusedCount,
    isScanningDuplicates,
    onScanDuplicates,
    duplicateCount,
    isCleaningEncoding,
    onCleanEncoding
}: ScanMenuModalProps) {
    if (!isOpen) return null;

    const tools = [
        {
            id: 'broken',
            label: 'Photos Cassées',
            description: 'Détecte les images qui ne s\'affichent plus sur le site',
            icon: ShieldAlert,
            color: 'neon-red',
            action: onScanBroken,
            loading: isScanningBroken,
            count: brokenCount,
            countLabel: 'trouvées'
        },
        {
            id: 'unused',
            label: 'Images Inutilisées',
            description: 'Identifie les fichiers R2 non référencés dans la base',
            icon: HardDrive,
            color: 'neon-orange',
            action: onScanUnused,
            loading: isScanningUnused,
            count: unusedCount,
            countLabel: 'inutilisées'
        },
        {
            id: 'duplicates',
            label: 'Doublons R2',
            description: 'Trouve les fichiers identiques uploadés plusieurs fois',
            icon: FileSearch,
            color: 'neon-cyan',
            action: onScanDuplicates,
            loading: isScanningDuplicates,
            count: duplicateCount,
            countLabel: 'doublons'
        },
        {
            id: 'encoding',
            label: 'Nettoyage Texte',
            description: 'Corrige les erreurs d\'encodage et accents (Ã© -> é)',
            icon: RefreshCw,
            color: 'neon-purple',
            action: onCleanEncoding,
            loading: isCleaningEncoding
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-cyan to-neon-purple shadow-[0_0_20px_rgba(255,0,51,0.3)]" />
                    
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-2">
                                Centre <span className="text-neon-cyan">de Scan</span>
                            </h2>
                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Maintenance & Intégrité des données</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={tool.action}
                                disabled={tool.loading}
                                className="group relative flex flex-col items-start p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/20 rounded-3xl transition-all duration-500 text-left overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${tool.color}/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                
                                <div className="flex items-center gap-4 mb-4 relative z-10">
                                    <div className={`p-4 bg-${tool.color}/10 rounded-2xl border border-${tool.color}/20 group-hover:scale-110 transition-transform duration-500`}>
                                        {tool.loading ? (
                                            <Loader2 className={`w-6 h-6 text-${tool.color} animate-spin`} />
                                        ) : (
                                            <tool.icon className={`w-6 h-6 text-${tool.color}`} />
                                        )}
                                    </div>
                                    <span className="text-lg font-black text-white uppercase italic tracking-tighter group-hover:text-neon-cyan transition-colors">{tool.label}</span>
                                </div>

                                <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest mb-4 flex-1">
                                    {tool.description}
                                </p>

                                <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${tool.loading ? 'bg-neon-cyan animate-pulse' : 'bg-gray-700'}`} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${tool.loading ? 'text-neon-cyan' : 'text-gray-500'}`}>
                                            {tool.loading ? 'Analyse...' : 'Prêt'}
                                        </span>
                                    </div>
                                    {tool.count !== undefined && !tool.loading && (
                                        <span className={`px-2 py-0.5 rounded-lg bg-${tool.color}/10 border border-${tool.color}/20 text-${tool.color} text-[9px] font-black uppercase`}>
                                            {tool.count} {tool.countLabel}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                        <AlertTriangle className="w-5 h-5 text-gray-600 shrink-0" />
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed italic">
                            Les opérations de scan parcourent l'intégralité du bucket R2 et de la base de données. 
                            Certaines actions peuvent prendre plusieurs secondes selon le volume de fichiers.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[9px] transition-all border border-white/10"
                    >
                        Quitter le Maintenance Center
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
