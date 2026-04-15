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
            const cards = Array.from(container.querySelectorAll('.interview-card'));
            if (cards.length === 0) throw new Error("Aucune carte trouvée");
            
            setGenProgress({ current: 0, total: cards.length });
            const zip = new JSZip();
            
            for (let i = 0; i < cards.length; i++) {
                setGenProgress({ current: i + 1, total: cards.length });
                const card = cards[i] as HTMLElement;
                
                // Hide download buttons during capture
                const buttons = card.querySelectorAll('.capture-btn');
                buttons.forEach(b => (b as HTMLElement).style.display = 'none');

                await new Promise(r => setTimeout(r, 300));

                try {
                    const canvas = await html2canvas(card, {
                        scale: 2,
                        backgroundColor: null,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        removeContainer: true,
                        onclone: (clonedDoc) => {
                            const styles = clonedDoc.getElementsByTagName('style');
                            for (let k = styles.length - 1; k >= 0; k--) styles[k].remove();
                            const links = clonedDoc.getElementsByTagName('link');
                            for (let k = links.length - 1; k >= 0; k--) links[k].remove();
                        }
                    });
                    
                    const dataUrl = canvas.toDataURL('image/png', 1.0);
                    const base64Data = dataUrl.split(',')[1];
                    
                    const filename = i === 0 ? '00_Cover.png' : `Page_${String(i).padStart(2, '0')}.png`;
                    zip.file(filename, base64Data, { base64: true });
                } catch (err) {
                    console.error(`Error rendering card ${i}:`, err);
                } finally {
                    buttons.forEach(b => (b as HTMLElement).style.display = 'flex');
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            if (content.size < 100) throw new Error("Fichier ZIP corrompu");
            saveAs(content, "Interview_Cards_Dropsiders.zip");
        } catch (error) {
            alert("Erreur lors de la génération du ZIP: " + error);
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
            const cards = Array.from(container.querySelectorAll('.interview-card'));
            if (cards.length === 0) throw new Error("Aucune carte trouvée");

            setGenProgress({ current: 0, total: cards.length });
            const pdf = new jsPDF('p', 'mm', 'a5');
            
            for (let i = 0; i < cards.length; i++) {
                setGenProgress({ current: i + 1, total: cards.length });
                const card = cards[i] as HTMLElement;
                
                const buttons = card.querySelectorAll('.capture-btn');
                buttons.forEach(b => (b as HTMLElement).style.display = 'none');

                await new Promise(r => setTimeout(r, 400));
                
                try {
                    const canvas = await html2canvas(card, {
                        scale: 2,
                        backgroundColor: '#ffffff',
                        useCORS: true,
                        allowTaint: true,
                        onclone: (clonedDoc) => {
                            const styles = clonedDoc.getElementsByTagName('style');
                            for (let k = styles.length - 1; k >= 0; k--) styles[k].remove();
                            const links = clonedDoc.getElementsByTagName('link');
                            for (let k = links.length - 1; k >= 0; k--) links[k].remove();
                        }
                    });
                    
                    const imgData = canvas.toDataURL('image/png', 1.0);
                    if (i > 0) pdf.addPage();
                    pdf.setPage(i + 1);
                    pdf.addImage(imgData, 'PNG', 0, 0, 148, 210, undefined, 'FAST');
                } catch (err) {
                    console.error(`Error rendering page ${i}:`, err);
                } finally {
                    buttons.forEach(b => (b as HTMLElement).style.display = 'flex');
                }
            }

            pdf.save("Interview_Cards_Dropsiders.pdf");
        } catch (error) {
            alert("Erreur lors de la génération du PDF: " + error);
        } finally {
            setIsGenerating(false);
            setExportType(null);
        }
    };

    const captureSingleCard = async (e: React.MouseEvent, cardId: string, name: string) => {
        try {
            e.stopPropagation();
            const card = document.getElementById(cardId);
            if (!card) return;

            const btn = e.currentTarget as HTMLElement;
            btn.style.visibility = 'hidden';

            const canvas = await html2canvas(card, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                onclone: (clonedDoc) => {
                    // NUCLEAR CLEANUP: Remove everything that could crash the capture
                    const styles = clonedDoc.getElementsByTagName('style');
                    for (let i = styles.length - 1; i >= 0; i--) styles[i].remove();
                    const links = clonedDoc.getElementsByTagName('link');
                    for (let i = links.length - 1; i >= 0; i--) links[i].remove();
                },
                ignoreElements: (element) => element.classList.contains('capture-btn')
            });
            
            const link = document.createElement('a');
            link.download = `${name}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            btn.style.visibility = 'visible';
        } catch (err) {
            alert("Erreur de capture: " + err);
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
                    </div>

                    {/* Right Panel: Preview Area */}
                    <div className="flex-1 bg-black/20 p-12 overflow-y-auto custom-scrollbar flex flex-col items-center gap-12">
                        <div ref={cardsRef} className="flex flex-col gap-16 items-center w-full max-w-[500px]">
                            {questionChunks.length > 0 && (
                                <>
                                    {/* Cover Page (Recto) */}
                                    <div 
                                        id="card-cover"
                                        className="interview-card relative overflow-hidden flex flex-col group"
                                        style={{ 
                                            width: '148mm', 
                                            height: '210mm', 
                                            minWidth: '420px', 
                                            minHeight: '595px',
                                            backgroundColor: '#ffffff',
                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <button 
                                            onClick={(e) => captureSingleCard(e, 'card-cover', 'Interview_Cover')}
                                            className="capture-btn absolute top-6 right-6 z-50 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shadow-2xl"
                                            style={{ 
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                border: '1px solid rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            <Download className="w-3 h-3" /> PNG
                                        </button>

                                        <div className="w-full h-full flex flex-col items-center justify-center p-16 relative overflow-hidden shrink-0 text-center"
                                            style={{ 
                                                background: theme === 'red' 
                                                    ? 'linear-gradient(to bottom, #ff0000, #ff3355, #000000)' 
                                                    : theme === 'cyan' 
                                                    ? 'linear-gradient(to bottom, #00f0ff, #0066ff, #000000)'
                                                    : 'linear-gradient(to bottom, #bc13fe, #ff00ff, #000000)'
                                            }}
                                        >
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
                                            id={`card-page-${chunkIdx}`}
                                            className="interview-card relative overflow-hidden flex flex-col shrink-0 group"
                                            style={{ 
                                                width: '148mm', 
                                                height: '210mm',
                                                minWidth: '420px', 
                                                minHeight: '595px',
                                                backgroundColor: '#ffffff',
                                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <button 
                                                onClick={(e) => captureSingleCard(e, `card-page-${chunkIdx}`, `Interview_Page_${chunkIdx + 1}`)}
                                                className="capture-btn absolute top-6 right-6 z-50 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shadow-2xl"
                                                style={{ 
                                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                                    border: '1px solid rgba(255,255,255,0.2)'
                                                }}
                                            >
                                                <Download className="w-3 h-3" /> PNG
                                            </button>
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
                                            <div className="interview-header"
                                                style={{ 
                                                    width: '100%',
                                                    height: '80px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0 40px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                    background: theme === 'red' 
                                                        ? 'linear-gradient(to right, #ff0000, #ff3355, #000000)' 
                                                        : theme === 'cyan' 
                                                        ? 'linear-gradient(to right, #00f0ff, #0066ff, #000000)'
                                                        : 'linear-gradient(to right, #bc13fe, #ff00ff, #000000)'
                                                }}
                                            >
                                                <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
                                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '256px', height: '256px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(60px)', transform: 'translate(50%, -50%)' }} />
                                                </div>
                                                
                                                <div style={{ position: 'relative', zIndex: 10 }}>
                                                    <h2 style={{ fontSize: '20px', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.05em', lineHeight: 1 }}>
                                                        Interviews <span style={{ opacity: 0.6, fontSize: '12px', verticalAlign: 'top', marginLeft: '4px' }}>#2026</span>
                                                    </h2>
                                                </div>
                                                
                                                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <img 
                                                        src="/Logo.png" 
                                                        alt="Dropsiders" 
                                                        style={{ height: `${headerLogoSize * 4}px`, filter: 'brightness(0) invert(1)', marginBottom: '6px' }}
                                                    />
                                                    <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Page {chunkIdx + 1}</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 32px', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {chunk.map((q) => (
                                                        <div key={q.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
                                                            <span style={{ fontSize: '14px', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontStyle: 'italic', flexShrink: 0, width: '20px', color: theme === 'red' ? '#ff0000' : theme === 'cyan' ? '#000000' : '#bc13fe' }}>
                                                                {q.number.padStart(2, '0')}
                                                            </span>
                                                            <div style={{ flex: 1 }}>
                                                                <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#000000', textTransform: 'uppercase', lineHeight: '1.2', marginBottom: '4px', margin: 0 }}>
                                                                    {q.fr}
                                                                </h3>
                                                                {q.en && (
                                                                    <p style={{ fontSize: '12px', fontWeight: 700, lineHeight: '1.2', margin: 0, color: theme === 'red' ? '#dc2626' : theme === 'cyan' ? '#1d4ed8' : '#7e22ce' }}>
                                                                        {q.en}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div style={{ padding: '20px', paddingTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.3, flexShrink: 0 }}>
                                                <span style={{ fontSize: '7px', color: '#000000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em' }}>EXCLUSIVE CONTENT</span>
                                                <span style={{ fontSize: '7px', color: '#000000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em' }}>DROPSIDERS.FR</span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
