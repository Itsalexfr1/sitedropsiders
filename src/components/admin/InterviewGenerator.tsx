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
    Columns,
    Languages,
    Eye,
    Settings,
    Image as ImageIcon
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
    const [swapLanguages, setSwapLanguages] = useState(false);
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

    // ------------------------------------------------------------
    // PURE CANVAS RENDER ENGINE
    // ------------------------------------------------------------
    // Draws cards directly with Canvas 2D API — no html2canvas, no CSS, no iframe.
    // Text is drawn with ctx.fillText(), images with ctx.drawImage(). Bulletproof.

    const loadImg = (src: string): Promise<HTMLImageElement | null> =>
        new Promise(resolve => {
            if (!src) return resolve(null);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = src;
        });

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
            else line = test;
        }
        if (line) lines.push(line);
        return lines;
    };

    const renderCardToCanvas = async (
        type: 'cover' | 'questions',
        chunk?: InterviewQuestion[],
        chunkIdx?: number
    ): Promise<HTMLCanvasElement> => {
        const W = 420, H = 595, SCALE = 2;
        const canvas = document.createElement('canvas');
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(SCALE, SCALE);

        const c1 = theme === 'red' ? '#ff0000' : theme === 'cyan' ? '#00ccff' : '#bc13fe';
        const c2 = theme === 'red' ? '#990011' : theme === 'cyan' ? '#0044cc' : '#8800cc';
        const accent = theme === 'red' ? '#ff0000' : theme === 'cyan' ? '#0033cc' : '#bc13fe';
        const enCol = theme === 'red' ? '#cc0000' : theme === 'cyan' ? '#1d4ed8' : '#7e22ce';

        const logo = await loadImg('/Logo.png');

        const drawLogoWhite = (img: HTMLImageElement, x: number, y: number, h: number) => {
            const w = (img.naturalWidth / img.naturalHeight) * h;
            // Draw on temp canvas to invert
            const tmp = document.createElement('canvas');
            tmp.width = img.naturalWidth; tmp.height = img.naturalHeight;
            const tc = tmp.getContext('2d')!;
            tc.drawImage(img, 0, 0);
            const id = tc.getImageData(0, 0, tmp.width, tmp.height);
            for (let i = 0; i < id.data.length; i += 4) {
                const a = id.data[i + 3];
                id.data[i] = 255; id.data[i + 1] = 255; id.data[i + 2] = 255;
                id.data[i + 3] = a; // keep original alpha
            }
            tc.putImageData(id, 0, 0);
            ctx.drawImage(tmp, x, y, w, h);
        };

        if (type === 'cover') {
            // Background gradient
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, c1); g.addColorStop(0.5, c2); g.addColorStop(1, '#000000');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

            let y = 90;

            // Logo
            if (logo) {
                const lh = 40, lw = (logo.naturalWidth / logo.naturalHeight) * lh;
                drawLogoWhite(logo, (W - lw) / 2, y, lh);
                y += lh + 24;
            }

            // Divider
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect((W - 52) / 2, y, 52, 3);
            y += 22;

            // "INTERVIEW"
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic 900 52px Orbitron, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('INTERVIEW', W / 2, y);
            y += 52;

            // "QUESTIONS"
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'italic 900 52px Orbitron, sans-serif';
            ctx.fillText('QUESTIONS', W / 2, y);
            y += 62;

            // "LIVE REPORT 2026"
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '800 11px Montserrat, sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText('LIVE REPORT 2026', W / 2, y);
            ctx.letterSpacing = '0px';
            y += 40;

            // Festival logo
            if (festivalLogo) {
                const fest = await loadImg(festivalLogo);
                if (fest) {
                    ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.font = '700 8px Montserrat, sans-serif';
                    ctx.fillText('OFFICIAL COVERAGE AT', W / 2, y);
                    y += 20;
                    const maxH = 120, maxW = 280;
                    let fw = fest.naturalWidth, fh = fest.naturalHeight;
                    const ratio = fw / fh;
                    if (fh > maxH) { fh = maxH; fw = fh * ratio; }
                    if (fw > maxW) { fw = maxW; fh = fw / ratio; }
                    ctx.drawImage(fest, (W - fw) / 2, y, fw, fh);
                }
            }

            // Footer
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.font = '700 7px Montserrat, sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText('DROPSIDERS EXCLUSIVE', W / 2, H - 36);
            ctx.letterSpacing = '0px';

        } else {
            // White background
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

            // Watermark
            if (festivalLogo) {
                const wm = await loadImg(festivalLogo);
                if (wm) {
                    const wmW = W * watermarkScale / 100;
                    const wmH = (wm.naturalHeight / wm.naturalWidth) * wmW;
                    ctx.save();
                    ctx.globalAlpha = watermarkOpacity / 100;
                    ctx.translate(W / 2, H / 2);
                    ctx.rotate(12 * Math.PI / 180);
                    // Draw original colors with globalAlpha
                    ctx.drawImage(wm, -wmW / 2, -wmH / 2, wmW, wmH);
                    ctx.restore();
                }
            }

            // Header gradient
            const hg = ctx.createLinearGradient(0, 0, W, 0);
            hg.addColorStop(0, c1); hg.addColorStop(0.6, c2); hg.addColorStop(1, '#000000');
            ctx.fillStyle = hg; ctx.fillRect(0, 0, W, 68);

            // Header title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic 900 14px Orbitron, sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('INTERVIEWS', 28, 30);
            ctx.font = '700 7.5px Montserrat, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('#2026', 28, 46);

            // Header logo
            if (logo) {
                const lh = headerLogoSize * 4;
                const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
                drawLogoWhite(logo, W - 28 - lw, (68 - lh) / 2, lh);
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = '700 6px Montserrat, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Page ${(chunkIdx ?? 0) + 1}`, W - 28 - lw / 2, 62);
            }

            // Questions
            let qY = 80;
            const PAD_L = 28, TEXT_X = 52, TEXT_W = W - TEXT_X - 26;
            const LINE_FR = 12.5;  // line height for FR text
            const LINE_EN = 12;    // line height for EN text

            for (const q of (chunk || [])) {
                // Top (t1) is always primary (Main), Bottom (t2) is always secondary (Sub)
                const t1 = swapLanguages ? (q.en || '').toUpperCase() : (q.fr || '').toUpperCase();
                const t2 = swapLanguages ? q.fr : q.en;
                const isT1Main = true; // Position-based styling: Top is always main

                // Number
                ctx.fillStyle = accent;
                ctx.font = 'italic 900 12px Orbitron, sans-serif';
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                ctx.fillText(q.number.padStart(2, '0'), PAD_L, qY + 1);

                // T1 (Top line)
                if (t1) {
                    ctx.fillStyle = isT1Main ? '#111111' : enCol;
                    ctx.font = isT1Main ? '800 10.5px Montserrat, sans-serif' : '600 10px Montserrat, sans-serif';
                    const lines = wrapText(ctx, t1, TEXT_W);
                    for (const line of lines) {
                        ctx.fillText(line, TEXT_X, qY);
                        qY += isT1Main ? LINE_FR : LINE_EN;
                    }
                }

                // T2 (Bottom line)
                if (t2) {
                    ctx.fillStyle = !isT1Main ? '#111111' : enCol;
                    ctx.font = !isT1Main ? '800 10.5px Montserrat, sans-serif' : '600 10px Montserrat, sans-serif';
                    const lines = wrapText(ctx, t2, TEXT_W);
                    for (const line of lines) {
                        ctx.fillText(line, TEXT_X, qY);
                        qY += !isT1Main ? LINE_FR : LINE_EN;
                    }
                }
                
                qY += 4;
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(PAD_L, qY); ctx.lineTo(W - PAD_L, qY);
                ctx.stroke();
                qY += 7;

                if (qY > H - 44) break;
            }

            // Footer
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.font = '700 6px Montserrat, sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('EXCLUSIVE CONTENT', PAD_L, H - 20);
            ctx.textAlign = 'right';
            ctx.fillText('DROPSIDERS.FR', W - PAD_L, H - 20);
        }

        return canvas;
    };

    const downloadZip = async () => {
        setIsGenerating(true);
        setExportType('zip');
        try {
            const allCards = [
                { type: 'cover' as const },
                ...questionChunks.map((chunk, i) => ({ type: 'questions' as const, chunk, chunkIdx: i }))
            ];
            setGenProgress({ current: 0, total: allCards.length });
            const zip = new JSZip();
            for (let i = 0; i < allCards.length; i++) {
                setGenProgress({ current: i + 1, total: allCards.length });
                const c = allCards[i];
                const canvas = await renderCardToCanvas(c.type, (c as any).chunk, (c as any).chunkIdx);
                const base64 = canvas.toDataURL('image/png', 1.0).split(',')[1];
                zip.file(i === 0 ? '00_Cover.png' : `Page_${String(i).padStart(2, '0')}.png`, base64, { base64: true });
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'Interview_Cards_Dropsiders.zip');
        } catch (err) { alert('Erreur ZIP: ' + err); }
        finally { setIsGenerating(false); setExportType(null); }
    };

    const downloadPDF = async () => {
        setIsGenerating(true);
        setExportType('pdf');
        try {
            const allCards = [
                { type: 'cover' as const },
                ...questionChunks.map((chunk, i) => ({ type: 'questions' as const, chunk, chunkIdx: i }))
            ];
            setGenProgress({ current: 0, total: allCards.length });
            const pdf = new jsPDF('p', 'mm', 'a5');
            for (let i = 0; i < allCards.length; i++) {
                setGenProgress({ current: i + 1, total: allCards.length });
                const c = allCards[i];
                const canvas = await renderCardToCanvas(c.type, (c as any).chunk, (c as any).chunkIdx);
                if (i > 0) pdf.addPage();
                pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 148, 210, undefined, 'FAST');
            }
            pdf.save('Interview_Cards_Dropsiders.pdf');
        } catch (err) { alert('Erreur PDF: ' + err); }
        finally { setIsGenerating(false); setExportType(null); }
    };

    const captureSingleCard = async (e: React.MouseEvent, cardId: string, name: string) => {
        e.stopPropagation();
        try {
            const isCover = cardId === 'card-cover';
            let canvas: HTMLCanvasElement;
            if (isCover) {
                canvas = await renderCardToCanvas('cover');
            } else {
                const pageNum = parseInt(cardId.replace('card-page-', ''), 10);
                canvas = await renderCardToCanvas('questions', questionChunks[pageNum], pageNum);
            }
            const link = document.createElement('a');
            link.download = `${name}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (err) { alert('Erreur: ' + err); }
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
                                Interview <span className={colors.main}>Generator</span>
                            </h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Format A5 Premium • Export Multi-Pages</p>
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
                                placeholder="1. Présente-toi...\nIntroduce yourself...\n2. Si tu devais..."
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
                                ) : <Languages className="w-5 h-5" />}
                                Traduire en Anglais (IA)
                            </button>
                            <button
                                onClick={parseQuestions}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                            >
                                <Eye className="w-5 h-5" /> Générer Aperçu
                            </button>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3.5 h-3.5" /> Logo du Festival (Optionnel)
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
                                <Settings className="w-3.5 h-3.5" /> Configuration Visuelle
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

                                {/* Language Order Toggle */}
                                <div className="pt-4 border-t border-white/5">
                                    <button 
                                        onClick={() => setSwapLanguages(!swapLanguages)}
                                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all ${swapLanguages ? 'bg-neon-red/20 border border-neon-red/30 text-neon-red shadow-lg shadow-neon-red/5' : 'bg-white/5 border border-white/10 text-gray-400'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Columns className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                {swapLanguages ? 'Ordre: EN -> FR' : 'Ordre: FR -> EN'}
                                            </span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${swapLanguages ? 'bg-neon-red' : 'bg-gray-700'}`}>
                                            <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${swapLanguages ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {questions.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">RÉSUMÉ : {questions.length} Questions</h4>
                                
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
                                    Export Premium A5 • {questionChunks.length + 1} pages
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
                                                    <div style={{ fontSize: '56px', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, color: '#ffffff', fontStyle: 'italic', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: '0.95' }}>Interview</div>
                                                    <div style={{ fontSize: '56px', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, color: 'rgba(255,255,255,0.42)', fontStyle: 'italic', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: '0.95' }}>Questions</div>
                                                    <div style={{ fontSize: '11px', fontFamily: 'Montserrat, sans-serif', color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5em', marginTop: '14px' }}>Live Report 2026</div>
                                                </div>

                                                {festivalLogo && (
                                                    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Official Coverage at</span>
                                                        <img src={festivalLogo} alt="Festival" style={{ height: "160px", objectFit: "contain" }} />
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
                                                            width: `${watermarkScale}%`
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
                                                    <h2 style={{ fontSize: '14px', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
                                                        Interviews <span style={{ opacity: 0.6, fontSize: '8px', verticalAlign: 'top', marginLeft: '2px' }}>#2026</span>
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
                                                            <span style={{ fontSize: '11px', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontStyle: 'italic', flexShrink: 0, width: '22px', color: theme === 'red' ? '#ff0000' : theme === 'cyan' ? '#000000' : '#bc13fe', marginTop: '1px' }}>
                                                                {q.number.padStart(2, '0')}
                                                            </span>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#111111', textTransform: 'uppercase', lineHeight: 1.3, marginBottom: '2px', fontFamily: 'Montserrat, sans-serif' }}>
                                                                    {swapLanguages ? q.en : q.fr}
                                                                </div>
                                                                {(swapLanguages ? q.fr : q.en) && (
                                                                    <div style={{ fontSize: '10px', fontWeight: 600, lineHeight: 1.3, color: theme === 'red' ? '#cc0000' : theme === 'cyan' ? '#1d4ed8' : '#7e22ce', fontFamily: 'Montserrat, sans-serif' }}>
                                                                        {swapLanguages ? q.fr : q.en}
                                                                    </div>
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



