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


    // Compute question chunks early so capture functions can use them
    const questionsPerPage = 8;
    const chunkQuestions = (arr: InterviewQuestion[], size: number) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };
    const questionChunks = chunkQuestions(questions, questionsPerPage);

    // ─── ISOLATED RENDER ENGINE ───────────────────────────────────────────────
    // Builds card HTML with ONLY inline styles in an isolated iframe (no Tailwind!)
    // and captures it via html2canvas. This is immune to oklab/oklch CSS crashes.

    const buildCardHTML = (type: 'cover' | 'questions', chunk?: InterviewQuestion[], chunkIdx?: number) => {
        const gradientHeader = theme === 'red'
            ? 'linear-gradient(to right, #ff0000, #ff3355, #000000)'
            : theme === 'cyan'
            ? 'linear-gradient(to right, #00f0ff, #0066ff, #000000)'
            : 'linear-gradient(to right, #bc13fe, #ff00ff, #000000)';
        const gradientCover = theme === 'red'
            ? 'linear-gradient(to bottom, #ff0000, #dd1133, #000000)'
            : theme === 'cyan'
            ? 'linear-gradient(to bottom, #00f0ff, #0066ff, #000000)'
            : 'linear-gradient(to bottom, #bc13fe, #dd00ff, #000000)';
        const accentColor = theme === 'red' ? '#ff0000' : theme === 'cyan' ? '#000000' : '#bc13fe';
        const textColor = theme === 'red' ? '#dc2626' : theme === 'cyan' ? '#1d4ed8' : '#7e22ce';

        const logoSizePx = headerLogoSize * 4;

        if (type === 'cover') {
            const festivalSection = festivalLogo ? `
                <div style="margin-top:32px;display:flex;flex-direction:column;align-items:center;gap:12px;">
                    <span style="font-size:9px;color:rgba(255,255,255,0.35);font-weight:700;text-transform:uppercase;letter-spacing:0.4em;">Official Coverage at</span>
                    <img src="${festivalLogo}" style="height:160px;object-fit:contain;filter:brightness(0) invert(1);" crossorigin="anonymous" />
                </div>` : '';
            return `
                <div style="width:420px;height:595px;background:${gradientCover};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 48px;position:relative;overflow:hidden;box-sizing:border-box;">
                    <div style="position:absolute;top:0;right:0;width:300px;height:300px;background:rgba(255,255,255,0.15);border-radius:50%;filter:blur(80px);transform:translate(40%,-40%);pointer-events:none;"></div>
                    <div style="display:flex;flex-direction:column;align-items:center;gap:28px;position:relative;z-index:10;">
                        <img src="/Logo.png" style="height:36px;filter:brightness(0) invert(1);" crossorigin="anonymous" />
                        <div style="width:60px;height:3px;background:rgba(255,255,255,0.4);border-radius:99px;"></div>
                        <div style="text-align:center;">
                            <div style="font-size:56px;font-family:Arial Black,sans-serif;font-weight:900;color:#ffffff;font-style:italic;text-transform:uppercase;line-height:1;letter-spacing:-2px;margin:0;">Interview</div>
                            <div style="font-size:56px;font-family:Arial Black,sans-serif;font-weight:900;color:rgba(255,255,255,0.45);font-style:italic;text-transform:uppercase;line-height:1;letter-spacing:-2px;margin:0;">Questions</div>
                            <p style="font-size:11px;color:rgba(255,255,255,0.55);font-weight:700;text-transform:uppercase;letter-spacing:0.5em;margin-top:16px;">Live Report 2026</p>
                        </div>
                        ${festivalSection}
                    </div>
                    <div style="position:absolute;bottom:40px;left:0;width:100%;text-align:center;opacity:0.3;">
                        <span style="font-size:7px;color:#ffffff;font-weight:900;text-transform:uppercase;letter-spacing:0.8em;">DROPSIDERS EXCLUSIVE</span>
                    </div>
                </div>`;
        }

        // Question page
        const watermarkHTML = festivalLogo ? `
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(12deg);opacity:${watermarkOpacity / 100};pointer-events:none;z-index:1;">
                <img src="${festivalLogo}" style="width:${watermarkScale}%;filter:brightness(0);" crossorigin="anonymous" />
            </div>` : '';

        const questionsHTML = (chunk || []).map(q => `
            <div style="display:flex;gap:18px;align-items:flex-start;border-bottom:1px solid rgba(0,0,0,0.07);padding-bottom:14px;">
                <span style="font-size:15px;font-family:Arial Black,sans-serif;font-weight:900;font-style:italic;flex-shrink:0;width:22px;color:${accentColor};line-height:1.2;">${q.number.padStart(2, '0')}</span>
                <div style="flex:1;">
                    <div style="font-size:12px;font-weight:900;color:#000000;text-transform:uppercase;line-height:1.25;margin-bottom:3px;font-family:Arial,sans-serif;">${q.fr}</div>
                    ${q.en ? `<div style="font-size:12px;font-weight:700;color:${textColor};line-height:1.25;font-family:Arial,sans-serif;">${q.en}</div>` : ''}
                </div>
            </div>`).join('');

        return `
            <div style="width:420px;height:595px;background:#ffffff;display:flex;flex-direction:column;position:relative;overflow:hidden;box-sizing:border-box;">
                ${watermarkHTML}
                <!-- Header -->
                <div style="background:${gradientHeader};height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;flex-shrink:0;position:relative;z-index:10;overflow:hidden;">
                    <div style="position:absolute;top:0;right:0;width:200px;height:200px;background:rgba(255,255,255,0.15);border-radius:50%;filter:blur(50px);transform:translate(40%,-40%);"></div>
                    <div style="font-size:17px;font-family:Arial Black,sans-serif;font-weight:900;color:#fff;text-transform:uppercase;font-style:italic;letter-spacing:-1px;position:relative;z-index:2;">Interviews <span style="opacity:0.6;font-size:10px;vertical-align:top;margin-left:3px;">#2026</span></div>
                    <div style="display:flex;flex-direction:column;align-items:center;position:relative;z-index:2;">
                        <img src="/Logo.png" style="height:${logoSizePx}px;filter:brightness(0) invert(1);display:block;" crossorigin="anonymous" />
                        <span style="font-size:6px;color:rgba(255,255,255,0.4);font-weight:700;text-transform:uppercase;letter-spacing:0.3em;margin-top:4px;">Page ${(chunkIdx ?? 0) + 1}</span>
                    </div>
                </div>
                <!-- Content -->
                <div style="flex:1;display:flex;flex-direction:column;padding:20px 32px;overflow:hidden;position:relative;z-index:10;">
                    <div style="display:flex;flex-direction:column;gap:13px;">
                        ${questionsHTML}
                    </div>
                </div>
                <!-- Footer -->
                <div style="padding:16px 32px;display:flex;align-items:center;justify-content:space-between;opacity:0.25;flex-shrink:0;z-index:10;">
                    <span style="font-size:6px;color:#000;font-weight:900;text-transform:uppercase;letter-spacing:0.5em;">EXCLUSIVE CONTENT</span>
                    <span style="font-size:6px;color:#000;font-weight:900;text-transform:uppercase;letter-spacing:0.5em;">DROPSIDERS.FR</span>
                </div>
            </div>`;
    };

    const captureHTML = (html: string): Promise<HTMLCanvasElement> => {
        return new Promise((resolve, reject) => {
            // Create a fully isolated iframe with no stylesheets
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:420px;height:595px;border:none;visibility:hidden;';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument!;
            iframeDoc.open();
            // Bare HTML — zero external CSS
            iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;}</style></head><body>${html}</body></html>`);
            iframeDoc.close();

            // Wait for images to load, then capture
            const startCapture = () => {
                html2canvas(iframeDoc.body.firstElementChild as HTMLElement, {
                    scale: 2,
                    backgroundColor: null,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    width: 420,
                    height: 595,
                }).then(canvas => {
                    document.body.removeChild(iframe);
                    resolve(canvas);
                }).catch(err => {
                    document.body.removeChild(iframe);
                    reject(err);
                });
            };

            // Give images 600ms to load
            setTimeout(startCapture, 600);
        });
    };

    const downloadZip = async () => {
        setIsGenerating(true);
        setExportType('zip');
        try {
            const allCards: Array<{ type: 'cover' | 'questions'; chunk?: InterviewQuestion[]; chunkIdx?: number }> = [
                { type: 'cover' },
                ...questionChunks.map((chunk, i) => ({ type: 'questions' as const, chunk, chunkIdx: i }))
            ];
            setGenProgress({ current: 0, total: allCards.length });
            const zip = new JSZip();

            for (let i = 0; i < allCards.length; i++) {
                setGenProgress({ current: i + 1, total: allCards.length });
                const card = allCards[i];
                const html = buildCardHTML(card.type, card.chunk, card.chunkIdx);
                const canvas = await captureHTML(html);
                const dataUrl = canvas.toDataURL('image/png', 1.0);
                const base64 = dataUrl.split(',')[1];
                const filename = i === 0 ? '00_Cover.png' : `Page_${String(i).padStart(2, '0')}.png`;
                zip.file(filename, base64, { base64: true });
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'Interview_Cards_Dropsiders.zip');
        } catch (err) {
            alert('Erreur ZIP: ' + err);
        } finally {
            setIsGenerating(false);
            setExportType(null);
        }
    };

    const downloadPDF = async () => {
        setIsGenerating(true);
        setExportType('pdf');
        try {
            const allCards: Array<{ type: 'cover' | 'questions'; chunk?: InterviewQuestion[]; chunkIdx?: number }> = [
                { type: 'cover' },
                ...questionChunks.map((chunk, i) => ({ type: 'questions' as const, chunk, chunkIdx: i }))
            ];
            setGenProgress({ current: 0, total: allCards.length });
            const pdf = new jsPDF('p', 'mm', 'a5');

            for (let i = 0; i < allCards.length; i++) {
                setGenProgress({ current: i + 1, total: allCards.length });
                const card = allCards[i];
                const html = buildCardHTML(card.type, card.chunk, card.chunkIdx);
                const canvas = await captureHTML(html);
                const imgData = canvas.toDataURL('image/png', 1.0);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, 148, 210, undefined, 'FAST');
            }

            pdf.save('Interview_Cards_Dropsiders.pdf');
        } catch (err) {
            alert('Erreur PDF: ' + err);
        } finally {
            setIsGenerating(false);
            setExportType(null);
        }
    };

    const captureSingleCard = async (e: React.MouseEvent, cardId: string, name: string) => {
        e.stopPropagation();
        try {
            // Determine which card type this is
            const isCover = cardId === 'card-cover';
            let html: string;
            if (isCover) {
                html = buildCardHTML('cover');
            } else {
                const pageNum = parseInt(cardId.replace('card-page-', ''), 10);
                html = buildCardHTML('questions', questionChunks[pageNum], pageNum);
            }
            const canvas = await captureHTML(html);
            const link = document.createElement('a');
            link.download = `${name}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (err) {
            alert('Erreur de capture: ' + err);
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
                                        style={{ 
                                            position: 'relative',
                                            width: '148mm', 
                                            height: '210mm', 
                                            minWidth: '420px', 
                                            minHeight: '595px',
                                            backgroundColor: '#ffffff',
                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <button 
                                            onClick={(e) => captureSingleCard(e, 'card-cover', 'Interview_Cover')}
                                            className="capture-btn"
                                            style={{ 
                                                position: 'absolute',
                                                top: '24px',
                                                right: '24px',
                                                zIndex: 50,
                                                backgroundColor: 'rgba(0,0,0,0.8)',
                                                color: '#ffffff',
                                                padding: '8px 16px',
                                                borderRadius: '999px',
                                                fontSize: '10px',
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Download className="w-3 h-3" /> PNG
                                        </button>

                                        <div style={{ 
                                            width: '100%',
                                            height: '100%',
                                            background: theme === 'red' 
                                                ? 'linear-gradient(to bottom, #ff0000, #ff3355, #000000)' 
                                                : theme === 'cyan' 
                                                ? 'linear-gradient(to bottom, #00f0ff, #0066ff, #000000)'
                                                : 'linear-gradient(to bottom, #bc13fe, #ff00ff, #000000)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '64px',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
                                                <div style={{ position: 'absolute', top: 0, right: 0, width: '384px', height: '384px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(33%, -33%)' }} />
                                            </div>

                                            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
                                                <img src="/Logo.png" alt="Dropsiders" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} />
                                                
                                                <div style={{ width: '64px', height: '4px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '999px' }} />
                                                
                                                <div style={{ textAlign: 'center' }}>
                                                    <h1 style={{ fontSize: '60px', fontFamily: '"Arial Black", sans-serif', fontWeight: 900, color: '#ffffff', fontStyle: 'italic', letterSpacing: '-0.05em', textTransform: 'uppercase', lineHeight: 1, margin: 0 }}>
                                                        Interview<br /><span style={{ color: 'rgba(255,255,255,0.5)' }}>Questions</span>
                                                    </h1>
                                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', marginTop: '16px', margin: 0 }}>Live Report 2026</p>
                                                </div>

                                                {festivalLogo && (
                                                    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Official Coverage at</span>
                                                        <img src={festivalLogo} alt="Festival" style={{ height: '192px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ position: 'absolute', bottom: '48px', left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
                                                <span style={{ fontSize: '8px', color: '#ffffff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8em' }}>DROPSIDERS EXCLUSIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Pages Preview */}
                                    {questionChunks.map((chunk, chunkIdx) => (
                                        <div 
                                            key={chunkIdx}
                                            id={`card-page-${chunkIdx}`}
                                            style={{ 
                                                position: 'relative',
                                                width: '148mm', 
                                                height: '210mm',
                                                minWidth: '420px', 
                                                minHeight: '595px',
                                                backgroundColor: '#ffffff',
                                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(0,0,0,0.05)',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                flexShrink: 0
                                            }}
                                        >
                                            <button 
                                                onClick={(e) => captureSingleCard(e, `card-page-${chunkIdx}`, `Interview_Page_${chunkIdx + 1}`)}
                                                className="capture-btn"
                                                style={{ 
                                                    position: 'absolute',
                                                    top: '24px',
                                                    right: '24px',
                                                    zIndex: 50,
                                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                                    color: '#ffffff',
                                                    padding: '8px 16px',
                                                    borderRadius: '999px',
                                                    fontSize: '10px',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Download className="w-3 h-3" /> PNG
                                            </button>
                                            
                                            {/* Background Festival Watermark */}
                                            {festivalLogo && (
                                                <div 
                                                    style={{ 
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        pointerEvents: 'none',
                                                        userSelect: 'none',
                                                        transform: 'rotate(12deg)',
                                                        opacity: watermarkOpacity / 100,
                                                        zIndex: 1
                                                    }}
                                                >
                                                    <img 
                                                        src={festivalLogo} 
                                                        alt="Watermark" 
                                                        style={{ 
                                                            width: `${watermarkScale}%`,
                                                            filter: 'brightness(0)'
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Header */}
                                            <div style={{ 
                                                width: '100%',
                                                height: '80px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0 40px',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                zIndex: 10,
                                                background: theme === 'red' 
                                                    ? 'linear-gradient(to right, #ff0000, #ff3355, #000000)' 
                                                    : theme === 'cyan' 
                                                    ? 'linear-gradient(to right, #00f0ff, #0066ff, #000000)'
                                                    : 'linear-gradient(to right, #bc13fe, #ff00ff, #000000)'
                                            }}>
                                                <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
                                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '256px', height: '256px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(60px)', transform: 'translate(50%, -50%)' }} />
                                                </div>
                                                
                                                <div style={{ position: 'relative', zIndex: 10 }}>
                                                    <h2 style={{ fontSize: '20px', fontFamily: '"Arial Black", sans-serif', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.05em', lineHeight: 1, margin: 0 }}>
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
                                            <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 40px', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {chunk.map((q) => (
                                                        <div key={q.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '16px' }}>
                                                            <span style={{ fontSize: '16px', fontFamily: '"Arial Black", sans-serif', fontWeight: 900, fontStyle: 'italic', flexShrink: 0, width: '24px', color: theme === 'red' ? '#ff0000' : theme === 'cyan' ? '#000000' : '#bc13fe' }}>
                                                                {q.number.padStart(2, '0')}
                                                            </span>
                                                            <div style={{ flex: 1 }}>
                                                                <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#000000', textTransform: 'uppercase', lineHeight: '1.2', marginBottom: '4px', margin: 0, fontFamily: 'sans-serif' }}>
                                                                    {q.fr}
                                                                </h3>
                                                                {q.en && (
                                                                    <p style={{ fontSize: '13px', fontWeight: 700, lineHeight: '1.2', margin: 0, color: theme === 'red' ? '#dc2626' : theme === 'cyan' ? '#1d4ed8' : '#7e22ce', fontFamily: 'sans-serif' }}>
                                                                        {q.en}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.3, flexShrink: 0, zIndex: 10 }}>
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
