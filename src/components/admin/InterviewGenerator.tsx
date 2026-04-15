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
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

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
    const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });
    const [exportType, setExportType] = useState<'zip' | 'pdf' | null>(null);
    const [theme, setTheme] = useState<'red' | 'cyan' | 'purple'>('red');
    const [festivalLogo, setFestivalLogo] = useState<string | null>(null);
    const [watermarkScale, setWatermarkScale] = useState(150);
    const [watermarkOpacity, setWatermarkOpacity] = useState(3);
    const [headerLogoSize, setHeaderLogoSize] = useState(6);
    const cardsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFestivalLogo(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const parseQuestions = () => {
        if (!inputText.trim()) return;

        // More robust line cleaning
        const lines = inputText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const parsed: InterviewQuestion[] = [];
        
        let current: { number: string; originalNum: string; fr: string; en: string[] } | null = null;

        for (const line of lines) {
            // Match number at start (01. or 1. or 1 - or 1)
            const numMatch = line.match(/^(\d+)[^a-zA-Z0-9]*(.*)$/);
            
            if (numMatch) {
                const rawNum = numMatch[1];
                const normNum = parseInt(rawNum, 10).toString();
                const content = numMatch[2].trim();

                // If we match the same number as current, it's the translation
                if (current && current.number === normNum) {
                    if (content) current.en.push(content);
                } else {
                    // Start new question, push old one
                    if (current) {
                        parsed.push({
                            id: Math.random().toString(36).substring(2, 11),
                            number: current.originalNum,
                            fr: current.fr,
                            en: current.en.join(' ')
                        });
                    }
                    current = {
                        number: normNum,
                        originalNum: rawNum,
                        fr: content,
                        en: []
                    };
                }
            } else if (current) {
                // If it's a line without a number, it's definitely an EN translation for the current FR
                current.en.push(line);
            }
        }

        // Final push
        if (current) {
            parsed.push({
                id: Math.random().toString(36).substring(2, 11),
                number: current.originalNum,
                fr: current.fr,
                en: current.en.join(' ')
            });
        }

        setQuestions(parsed);
    };

    const downloadZip = async () => {
        setIsGenerating(true);
        setExportType('zip');
        const container = cardsRef.current;
        if (!container) return;

        try {
            const cards = container.querySelectorAll('.interview-card');
            setGenProgress({ current: 0, total: cards.length });
            const zip = new JSZip();
            
            for (let i = 0; i < cards.length; i++) {
                setGenProgress({ current: i + 1, total: cards.length });
                const card = cards[i] as HTMLElement;
                
                await new Promise(r => setTimeout(r, 100));

                try {
                    const canvas = await html2canvas(card, {
                        scale: 2, // High quality
                        backgroundColor: '#ffffff',
                        logging: false,
                        useCORS: true,
                        allowTaint: true
                    });
                    
                    const dataUrl = canvas.toDataURL('image/png');
                    const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
                    
                    const filename = i === 0 ? '00_Interview_Recto.png' : `Page_${String(i).padStart(2, '0')}.png`;
                    zip.file(filename, base64Data, { base64: true });
                } catch (err) {
                    console.error(`Error rendering card ${i}:`, err);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "Interview_Cards_Dropsiders.zip");
        } catch (error) {
            console.error("ZIP Generation error:", error);
        } finally {
            setIsGenerating(false);
            setExportType(null);
        }
    };

    const downloadPDF = async () => {
        setIsGenerating(true);
        setExportType('pdf');
        const container = cardsRef.current;
        if (!container) return;

        try {
            const cards = container.querySelectorAll('.interview-card');
            setGenProgress({ current: 0, total: cards.length });
            const pdf = new jsPDF('p', 'mm', 'a5');
            
            for (let i = 0; i < cards.length; i++) {
                setGenProgress({ current: i + 1, total: cards.length });
                const card = cards[i] as HTMLElement;
                
                await new Promise(r => setTimeout(r, 100));
                
                try {
                    const canvas = await html2canvas(card, {
                        scale: 2, // High quality for print
                        backgroundColor: '#ffffff',
                        logging: false,
                        useCORS: true,
                        allowTaint: true
                    });
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    if (i > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, 0, 148, 210);
                } catch (err) {
                    console.error(`Error rendering page ${i}:`, err);
                }
            }

            pdf.save("Interview_Cards_Dropsiders.pdf");
        } catch (error) {
            console.error("PDF Generation error:", error);
        } finally {
            setIsGenerating(false);
            setExportType(null);
        }
    };

    const translateToEnglish = async () => {
        if (!inputText.trim()) return;
        setIsGenerating(true);

        const lines = inputText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const translatedLines: string[] = [];

        for (const line of lines) {
            const numMatch = line.match(/^(\d+)[^a-zA-Z0-9]*(.*)$/);
            
            if (numMatch) {
                const numStr = numMatch[1];
                const frText = numMatch[2].trim();
                translatedLines.push(`${numStr}. ${frText}`);
                
                try {
                    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(frText)}&langpair=fr|en`);
                    const data = await response.json();
                    if (data.responseData?.translatedText) {
                        translatedLines.push(data.responseData.translatedText);
                    }
                } catch (error) {
                    console.error("Translation error:", error);
                }
            } else {
                translatedLines.push(line);
            }
        }

        setInputText(translatedLines.join('\n'));
        setIsGenerating(false);
        setTimeout(parseQuestions, 50);
    };

    const getThemeColors = () => {
        switch (theme) {
            case 'cyan': return { main: 'text-neon-cyan', border: 'border-neon-cyan/20', glow: 'shadow-neon-cyan/20' };
            case 'purple': return { main: 'text-neon-purple', border: 'border-neon-purple/20', glow: 'shadow-neon-purple/20' };
            default: return { main: 'text-neon-red', border: 'border-neon-red/20', glow: 'shadow-neon-red/20' };
        }
    };

    const questionsPerPage = 8;

    const chunkQuestions = (arr: InterviewQuestion[], size: number) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    const questionChunks = chunkQuestions(questions, questionsPerPage);

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
                {/* Header Admin */}
                <div className="p-8 md:p-10 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-black/40 border ${colors.border}`}>
                            <Layout className={`w-8 h-8 ${colors.main}`} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tighter">
                                Interview <span className={colors.main}>Card Gen</span>
                            </h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Format A5 Premium - Multi-Questions</p>
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
                    <div className="w-1/3 p-8 border-r border-white/5 flex flex-col gap-6 overflow-y-auto custom-scrollbar text-white">
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

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={translateToEnglish}
                                disabled={isGenerating}
                                className={`w-full py-4 border font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${isGenerating ? 'border-white/5 text-gray-700 cursor-not-allowed' : 'border-neon-red/30 text-neon-red hover:bg-neon-red/10 animate-pulse'}`}
                            >
                                {isGenerating ? (
                                    <div className="w-5 h-5 border-2 border-neon-red/20 border-t-neon-red rounded-full animate-spin" />
                                ) : <Plus className="w-5 h-5" />}
                                Traduire en Anglais (IA)
                            </button>
                            <button
                                onClick={parseQuestions}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                            >
                                <RotateCcw className="w-5 h-5" /> Générer Aperçu
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" /> Logo du Festival (Optionnel)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest text-gray-400"
                                >
                                    {festivalLogo ? 'Changer le Logo' : 'Uploader le Logo'}
                                </button>
                                {festivalLogo && (
                                    <button
                                        onClick={() => setFestivalLogo(null)}
                                        className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {festivalLogo && (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                                    <img src={festivalLogo} alt="Preview" className="h-12 object-contain" />
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5" /> Configuration Visuelle
                            </label>
                            
                            <div className="space-y-6 bg-white/5 rounded-3xl p-6">
                                {/* Watermark Scale */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                                        <span>Taille Watermark</span>
                                        <span className="text-white">{watermarkScale}%</span>
                                    </div>
                                    <input 
                                        type="range" min="50" max="300" 
                                        value={watermarkScale}
                                        onChange={(e) => setWatermarkScale(parseInt(e.target.value))}
                                        className="w-full accent-neon-red"
                                    />
                                </div>

                                {/* Watermark Opacity */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                                        <span>Opacité Watermark</span>
                                        <span className="text-white">{watermarkOpacity}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="20" 
                                        value={watermarkOpacity}
                                        onChange={(e) => setWatermarkOpacity(parseInt(e.target.value))}
                                        className="w-full accent-neon-red"
                                    />
                                </div>

                                {/* Header Logo Size */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                                        <span>Taille Logo En-tête</span>
                                        <span className="text-white">{headerLogoSize}</span>
                                    </div>
                                    <input 
                                        type="range" min="3" max="10" step="0.5"
                                        value={headerLogoSize}
                                        onChange={(e) => setHeaderLogoSize(parseFloat(e.target.value))}
                                        className="w-full accent-neon-red"
                                    />
                                </div>
                            </div>
                        </div>

                        {questions.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Résumé : {questions.length} Questions</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={downloadZip}
                                        disabled={isGenerating}
                                        className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-2xl transition-all ${isGenerating && exportType === 'zip' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-white/90 shadow-white/5'}`}
                                    >
                                        {isGenerating && exportType === 'zip' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                                                <span>PAGE {genProgress.current}/{genProgress.total}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Images (ZIP)
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={downloadPDF}
                                        disabled={isGenerating}
                                        className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-2xl transition-all ${isGenerating && exportType === 'pdf' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-neon-red hover:bg-neon-red/80 text-white shadow-neon-red/20'}`}
                                    >
                                        {isGenerating && exportType === 'pdf' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span>PAGE {genProgress.current}/{genProgress.total}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4" />
                                                Document (PDF)
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest text-center mt-2">
                                    Export Premium A5 · {questionChunks.length + 1} pages
                                </p>
                            </div>
                        )}
                                      {/* Right Panel: Preview Area */}
                    <div className="flex-1 bg-black/20 p-12 overflow-y-auto custom-scrollbar flex flex-col items-center gap-12">
                        <div className="flex flex-col gap-16 items-center w-full max-w-[500px]">
                            {questionChunks.length > 0 && (
                                <>
                                    {/* Cover Page (Recto) */}
                                    <div className="interview-card relative bg-white overflow-hidden flex flex-col shadow-2xl border border-black/5"
                                        style={{ width: '148mm', height: '210mm', minWidth: '420px', minHeight: '595px' }}
                                    >
                                        <div className={`w-full h-full bg-gradient-to-b ${theme === 'red' ? 'from-neon-red via-[#ff3355]' : theme === 'cyan' ? 'from-neon-cyan via-blue-500' : 'from-neon-purple via-pink-500'} to-[#000] flex flex-col items-center justify-center p-16 relative overflow-hidden shrink-0 text-center`}>
                                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                                <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
                                            </div>

                                            <div className="relative z-10 flex flex-col items-center gap-8">
                                                <img src="/Logo.png" alt="Dropsiders" className="h-10 brightness-0 invert" />
                                                
                                                <div className="w-16 h-1 bg-white opacity-40 rounded-full" />
                                                
                                                <div className="space-y-4">
                                                    <h1 className="text-6xl font-display font-black text-white italic tracking-tighter uppercase leading-none">
                                                        Interview<br /><span className="text-black/50">Questions</span>
                                                    </h1>
                                                    <p className="text-sm text-white/60 font-black uppercase tracking-[0.5em]">Live Report 2026</p>
                                                </div>

                                                {festivalLogo && (
                                                    <div className="mt-8 flex flex-col items-center gap-4">
                                                        <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">Official Coverage at</span>
                                                        <img src={festivalLogo} alt="Festival" className="h-48 object-contain filter brightness-0 invert" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute bottom-12 left-0 w-full flex flex-col items-center opacity-30">
                                                <span className="text-[8px] text-white font-black uppercase tracking-[0.8em]">DROPSIDERS EXCLUSIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Pages Preview */}
                                    {questionChunks.map((chunk, chunkIdx) => (
                                        <div 
                                            key={chunkIdx}
                                            className="interview-card relative bg-white overflow-hidden flex flex-col shadow-2xl border border-black/5 shrink-0"
                                            style={{ 
                                                width: '148mm', 
                                                height: '210mm',
                                                minWidth: '420px', 
                                                minHeight: '595px'
                                            }}
                                        >
                                            {/* Background Festival Watermark */}
                                            {festivalLogo && (
                                                <div 
                                                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none rotate-12"
                                                    style={{ opacity: watermarkOpacity / 100 }}
                                                >
                                                    <img 
                                                        src={festivalLogo} 
                                                        alt="Watermark" 
                                                        className="brightness-0" 
                                                        style={{ width: `${watermarkScale}%` }}
                                                    />
                                                </div>
                                            )}

                                            {/* Header */}
                                            <div className={`w-full h-20 bg-gradient-to-r ${theme === 'red' ? 'from-neon-red via-[#ff3355]' : theme === 'cyan' ? 'from-neon-cyan via-blue-500' : 'from-neon-purple via-pink-500'} to-[#000] flex items-center justify-between px-10 relative overflow-hidden shrink-0`}>
                                                <div className="absolute inset-0 opacity-20 pointer-events-none">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                                </div>
                                                
                                                <div className="relative z-10">
                                                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                                        Interviews <span className="opacity-60 text-xs align-top ml-1">#2026</span>
                                                    </h2>
                                                </div>
                                                
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <img 
                                                        src="/Logo.png" 
                                                        alt="Dropsiders" 
                                                        className="brightness-0 invert mb-1.5" 
                                                        style={{ height: `${headerLogoSize * 4}px` }}
                                                    />
                                                    <span className="text-[7px] text-white/40 font-black uppercase tracking-[0.3em]">Page {chunkIdx + 1}</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="relative z-10 flex-1 flex flex-col p-8 pt-5 overflow-hidden">
                                                <div className="space-y-3">
                                                    {chunk.map((q) => (
                                                        <div key={q.id} className="flex gap-4 items-start border-b border-black/5 pb-3 last:border-0">
                                                            <span className={`text-sm font-display font-black italic shrink-0 w-5 ${theme === 'red' ? 'text-neon-red' : theme === 'cyan' ? 'text-black' : 'text-neon-purple'}`}>
                                                                {q.number.padStart(2, '0')}
                                                            </span>
                                                            <div className="flex-1">
                                                                <h3 className="text-[12px] font-bold text-black uppercase leading-[1.2] mb-1">
                                                                    {q.fr}
                                                                </h3>
                                                                {q.en && (
                                                                    <p className={`text-[12px] font-bold ${theme === 'red' ? 'text-red-600' : theme === 'cyan' ? 'text-blue-700' : 'text-purple-700'} leading-[1.2]`}>
                                                                        {q.en}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="p-5 pt-0 flex items-center justify-between opacity-30 shrink-0">
                                                <span className="text-[7px] text-black font-black uppercase tracking-[0.5em]">EXCLUSIVE CONTENT</span>
                                                <span className="text-[7px] text-black font-black uppercase tracking-[0.5em]">DROPSIDERS.FR</span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* OFF-SCREEN EXPORT CONTAINER - Bulletproof for html2canvas */}
            <div 
                ref={cardsRef} 
                className="fixed top-[-9999px] left-[-9999px] pointer-events-none"
                style={{ width: '148mm' }}
            >
                {questionChunks.length > 0 && (
                    <>
                        {/* Recto Copy for Export */}
                        <div className="interview-card relative bg-white overflow-hidden flex flex-col"
                            style={{ width: '148mm', height: '210mm' }}
                        >
                            <div className={`w-full h-full bg-gradient-to-b ${theme === 'red' ? 'from-neon-red via-[#ff3355]' : theme === 'cyan' ? 'from-neon-cyan via-blue-500' : 'from-neon-purple via-pink-500'} to-[#000] flex flex-col items-center justify-center p-16 text-center`}>
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
                                </div>
                                <div className="relative z-10 flex flex-col items-center gap-8">
                                    <img src="/Logo.png" alt="Dropsiders" className="h-10 brightness-0 invert" />
                                    <h1 className="text-6xl font-display font-black text-white italic uppercase tracking-tighter leading-none">
                                        Interview<br /><span className="text-black/50">Questions</span>
                                    </h1>
                                    {festivalLogo && <img src={festivalLogo} alt="Festival" className="h-48 object-contain filter brightness-0 invert" />}
                                </div>
                            </div>
                        </div>

                        {/* Question Pages Copy for Export */}
                        {questionChunks.map((chunk, chunkIdx) => (
                            <div 
                                key={chunkIdx}
                                className="interview-card relative bg-white overflow-hidden flex flex-col"
                                style={{ width: '148mm', height: '210mm' }}
                            >
                                {/* Watermark */}
                                {festivalLogo && (
                                    <div 
                                        className="absolute inset-0 flex items-center justify-center rotate-12"
                                        style={{ opacity: watermarkOpacity / 100 }}
                                    >
                                        <img src={festivalLogo} alt="Watermark" className="brightness-0" style={{ width: `${watermarkScale}%` }} />
                                    </div>
                                )}

                                {/* Header */}
                                <div className={`w-full h-20 bg-gradient-to-r ${theme === 'red' ? 'from-neon-red via-[#ff3355]' : theme === 'cyan' ? 'from-neon-cyan via-blue-500' : 'from-neon-purple via-pink-500'} to-[#000] flex items-center justify-between px-10 shrink-0`}>
                                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">
                                        Interviews <span className="opacity-60 text-xs align-top ml-1">#2026</span>
                                    </h2>
                                    <img src="/Logo.png" alt="Dropsiders" className="brightness-0 invert" style={{ height: `${headerLogoSize * 4}px` }} />
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex-1 p-8 pt-5">
                                    <div className="space-y-3">
                                        {chunk.map((q) => (
                                            <div key={q.id} className="flex gap-4 items-start border-b border-black/5 pb-3">
                                                <span className={`text-sm font-display font-black italic shrink-0 w-5 ${theme === 'red' ? 'text-neon-red' : theme === 'cyan' ? 'text-black' : 'text-neon-purple'}`}>
                                                    {q.number.padStart(2, '0')}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-[12px] font-bold text-black uppercase leading-[1.2] mb-1">{q.fr}</p>
                                                    {q.en && <p className={`text-[12px] font-bold ${theme === 'red' ? 'text-red-600' : theme === 'cyan' ? 'text-blue-700' : 'text-purple-700'} leading-[1.2]`}>{q.en}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-5 pt-0 flex items-center justify-between opacity-30">
                                    <span className="text-[7px] text-black font-black tracking-[0.5em]">EXCLUSIVE CONTENT</span>
                                    <span className="text-[7px] text-black font-black tracking-[0.5em]">DROPSIDERS.FR</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

