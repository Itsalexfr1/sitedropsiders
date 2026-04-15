import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Download, 
    Type, 
    FileText, 
    History, 
    Copy, 
    Check, 
    Plus, 
    RotateCcw,
    Trash2,
    Save,
    Layout,
    Columns
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface InterviewQuestion {
    id: string;
    number: string;
    fr: string;
    en: string;
}

export function InterviewGenerator({ onClose }: { onClose: () => void }) {
    const [inputText, setInputText] = useState('');
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [theme, setTheme] = useState<'red' | 'cyan' | 'purple'>('red');
    const cardsRef = useRef<HTMLDivElement>(null);

    const parseQuestions = () => {
        if (!inputText.trim()) return;

        const lines = inputText.split('\n').map(l => l.trim()).filter(l => l !== '');
        const parsed: InterviewQuestion[] = [];
        
        let current: Partial<InterviewQuestion> = {};

        lines.forEach((line) => {
            // Check if line starts with a number (e.g. "1 ", "1.", "1-")
            const numMatch = line.match(/^(\d+)[\.\-\s]+(.*)/);
            
            if (numMatch) {
                // If we were working on a question, push it before starting a new one
                if (current.number && current.fr) {
                    parsed.push({
                        id: Math.random().toString(36).substr(2, 9),
                        number: current.number,
                        fr: current.fr,
                        en: current.en || ''
                    } as InterviewQuestion);
                    current = {};
                }
                current.number = numMatch[1];
                current.fr = numMatch[2];
            } else {
                // It's likely the EN translation of the previous FR question
                current.en = line;
                // Once we have EN, we can consider the block complete
                if (current.number && current.fr) {
                    parsed.push({
                        id: Math.random().toString(36).substr(2, 9),
                        number: current.number!,
                        fr: current.fr!,
                        en: current.en || ''
                    } as InterviewQuestion);
                    current = {};
                }
            }
        });

        // Final push if something remains
        if (current.number && current.fr) {
            parsed.push({
                id: Math.random().toString(36).substr(2, 9),
                number: current.number,
                fr: current.fr,
                en: current.en || ''
            } as InterviewQuestion);
        }

        setQuestions(parsed);
    };

    const downloadAll = async () => {
        setIsGenerating(true);
        const container = cardsRef.current;
        if (!container) return;

        const cards = container.querySelectorAll('.interview-card');
        
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const canvas = await html2canvas(card, {
                scale: 3, // High quality
                backgroundColor: '#050505',
                logging: false,
                useCORS: true
            });
            
            const link = document.createElement('a');
            link.download = `Interview_Q${questions[i].number}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Wait a bit between downloads to not freeze UI
            await new Promise(r => setTimeout(r, 200));
        }
        
        setIsGenerating(false);
    };

    const getThemeColors = () => {
        switch (theme) {
            case 'cyan': return { main: 'text-neon-cyan', border: 'border-neon-cyan/20', glow: 'shadow-neon-cyan/20' };
            case 'purple': return { main: 'text-neon-purple', border: 'border-neon-purple/20', glow: 'shadow-neon-purple/20' };
            default: return { main: 'text-neon-red', border: 'border-neon-red/20', glow: 'shadow-neon-red/20' };
        }
    };

    const colors = getThemeColors();

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-7xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-black/40 border ${colors.border}`}>
                            <Layout className={`w-8 h-8 ${colors.main}`} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                Interview <span className={colors.main}>Card Gen</span>
                            </h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Format A5 Premium (148x210mm)</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1.5">
                            {(['red', 'cyan', 'purple'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${theme === t ? 'bg-white/10 ring-2 ring-white/20' : 'hover:bg-white/5'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-neon-${t}`} />
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex min-h-0">
                    {/* Left Panel: Input */}
                    <div className="w-1/3 p-8 border-r border-white/5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Coller les questions ici
                            </label>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="1. PrÃ©sente-toi...\nIntroduce yourself...\n2. Si tu devais..."
                                className="w-full h-96 bg-black/40 border border-white/10 rounded-[2rem] p-6 text-sm text-white focus:border-neon-red outline-none transition-all resize-none custom-scrollbar font-medium leading-relaxed"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={parseQuestions}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                            >
                                <RotateCcw className="w-5 h-5" /> Générer Aperçu
                            </button>
                            <button
                                onClick={() => setInputText('')}
                                className="w-full py-4 bg-white/5 border border-white/10 text-gray-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all text-[11px]"
                            >
                                <Trash2 className="w-4 h-4 inline-block mr-2" /> Vider
                            </button>
                        </div>
                        
                        {questions.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Résumé : {questions.length} Questions</h4>
                                <button
                                    onClick={downloadAll}
                                    disabled={isGenerating}
                                    className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl transition-all ${isGenerating ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-neon-red hover:bg-neon-red/80 text-white shadow-neon-red/20'}`}
                                >
                                    {isGenerating ? (
                                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Download className="w-6 h-6" />
                                            Tout Télécharger (PNG)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Preview Area */}
                    <div className="flex-1 bg-black/20 p-12 overflow-y-auto custom-scrollbar flex flex-col items-center gap-12">
                        <div ref={cardsRef} className="flex flex-col gap-16 items-center w-full max-w-[500px]">
                            {questions.length > 0 ? (
                                questions.map((q) => (
                                    <div 
                                        key={q.id}
                                        id={`card-${q.number}`}
                                        className="interview-card relative bg-[#050505] overflow-hidden flex flex-col shadow-2xl border border-white/5"
                                        style={{ 
                                            width: '148mm', 
                                            height: '210mm',
                                            minWidth: '420px', // Scaling prevention for preview
                                            minHeight: '595px'
                                        }}
                                    >
                                        {/* Background Elements */}
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neon-red via-white to-neon-red opacity-50" />
                                        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-neon-red/5 blur-[120px] rounded-full" />
                                        <div className="absolute -top-20 -left-20 w-80 h-80 bg-neon-red/5 blur-[120px] rounded-full" />
                                        
                                        {/* Large Number Background */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                                            <span className="text-[25rem] font-display font-black text-white/[0.02] italic tracking-tighter leading-none transform -rotate-12">
                                                {q.number.padStart(2, '0')}
                                            </span>
                                        </div>

                                        {/* Content Wrapper */}
                                        <div className="relative z-10 h-full flex flex-col p-16">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-20">
                                                <img src="/Logo.png" alt="Dropsiders" className="h-4 opacity-40 brightness-0 invert" />
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${colors.main}`}>EDC LAS VEGAS 2026</span>
                                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mt-1 italic">Interview Initiale</span>
                                                </div>
                                            </div>

                                            {/* Question Block */}
                                            <div className="flex-1 flex flex-col justify-center gap-10">
                                                <div className="flex gap-6 items-start">
                                                    <div className={`mt-2 w-2 h-12 bg-gradient-to-b from-white to-white/10 rounded-full shrink-0`} />
                                                    <div className="space-y-6">
                                                        <h3 className="text-4xl font-display font-black text-white uppercase italic leading-[1.15] tracking-tight">
                                                            {q.fr}
                                                        </h3>
                                                        <p className={`text-xl font-medium italic ${theme === 'red' ? 'text-neon-cyan' : theme === 'cyan' ? 'text-neon-red' : 'text-neon-cyan'} opacity-80 leading-relaxed max-w-[90%]`}>
                                                            {q.en}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="pt-12 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Question</span>
                                                    <span className={`text-3xl font-display font-black ${colors.main} italic`}>{q.number.padStart(2, '0')}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-700 font-black uppercase tracking-[0.6em]">DROPSIDERS.FR</span>
                                            </div>
                                        </div>
                                        
                                        {/* Side Lines */}
                                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />
                                    </div>
                                ))
                            ) : (
                                <div className="mt-40 p-12 text-center space-y-4">
                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10">
                                        <Columns className="w-10 h-10 text-gray-700" />
                                    </div>
                                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Veuillez coller des questions à gauche pour générer les visuels</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

