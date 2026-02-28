import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Share2, X, Download, Type, Layout, Upload, Trash2, PlusCircle, Layers, Settings,
    FileText, Save, Info, CheckCircle2, AlertCircle, ChevronRight, ArrowRight,
    ImageIcon, Instagram, Plus
} from 'lucide-react';

interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    onClose: () => void;
}

type ThemeType = 'NEWS' | 'RECAP' | 'MUSIQUE' | 'INTERVIEW';

export function SocialSuite({ title, imageUrl, onClose }: SocialSuiteProps) {
    const [theme, setTheme] = useState<ThemeType>('NEWS');
    const [showSwipe, setShowSwipe] = useState(false);
    const [customText, setCustomText] = useState((title || '').toUpperCase());
    const [bgImage, setBgImage] = useState<string>(imageUrl);
    const [isDownloading, setIsDownloading] = useState(false);
    const [visualsList, setVisualsList] = useState<string[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const themeColors: Record<ThemeType, { label: string; grad: string }> = {
        'NEWS': { label: '#ff0033', grad: '255, 0, 51' },
        'RECAP': { label: '#bd00ff', grad: '189, 0, 255' },
        'MUSIQUE': { label: '#39ff14', grad: '57, 255, 20' },
        'INTERVIEW': { label: '#00f0ff', grad: '0, 240, 255' }
    };

    const generateImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            let img: HTMLImageElement | null = null;
            if (bgImage) {
                img = new Image();
                img.crossOrigin = "anonymous";
                img.src = bgImage;

                await new Promise((resolve, reject) => {
                    img!.onload = resolve;
                    img!.onerror = reject;
                });
            }

            // Set canvas size (Post 1080x1440)
            canvas.width = 1080;
            canvas.height = 1440;

            // 1. Draw Background
            if (img) {
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            } else {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // 2. Draw Gradient Overlay (Matches user themes)
            const activeColor = themeColors[theme];
            const grad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);

            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
            grad.addColorStop(0.8, `rgba(${activeColor.grad}, 0.8)`);
            grad.addColorStop(1, `rgba(${activeColor.grad}, 1)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);

            // 3. Scanlines effect
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < canvas.height; i += 6) {
                ctx.fillRect(0, i, canvas.width, 2);
            }

            // 4. Custom Text Wrapping & Height Calculation
            const fontSize = 85;
            const lineHeight = fontSize * 1.2;
            ctx.fillStyle = '#ffffff';
            ctx.font = `900 italic ${fontSize}px "Built Bold", "Inter", sans - serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = canvas.width - 240;
            const paragraphs = customText.split('\n');
            let lines: string[] = [];

            paragraphs.forEach(paragraph => {
                const words = paragraph.split(' ');
                let currentLine = '';

                for (let n = 0; n < words.length; n++) {
                    const testLine = currentLine + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                        lines.push(currentLine.trim());
                        currentLine = words[n] + ' ';
                    } else {
                        currentLine = testLine;
                    }
                }
                lines.push(currentLine.trim());
            });

            const totalHeight = lines.length * lineHeight;

            // Instagram Grid Safe Zone (1:1 crop of 4:5 post)
            // Post: 1080x1440. Grid: 1080x1080. 
            // Crop takes 180px from top and 180px from bottom.
            // Safe zone is between Y=180 and Y=1260.
            const bottomMargin = 220;
            const startY = Math.min(1150, canvas.height - bottomMargin - (totalHeight / 2));

            // 5. Label (NEWS / RECAP / MUSIQUE / INTERVIEW)
            const label = theme;
            const labelBg = activeColor.label;
            const labelY = startY - (totalHeight / 2) - 100;

            ctx.font = 'bold 75px "Inter", sans-serif';
            const labelMetrics = ctx.measureText(label);
            const labelWidth = labelMetrics.width + 100;
            const labelX = (canvas.width - labelWidth) / 2;

            ctx.fillStyle = labelBg;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 30;
            ctx.fillRect(labelX, labelY - 80, labelWidth, 110);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 italic 75px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, canvas.width / 2, labelY - 20);

            // 6. Custom Text Rendering
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = `900 italic ${fontSize}px "Built Bold", "Inter", sans - serif`;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 20;

            lines.forEach((line, i) => {
                const lineY = startY - (totalHeight / 2) + (i * lineHeight) + (lineHeight / 2);
                ctx.fillText(line.toUpperCase(), canvas.width / 2, lineY);
            });
            ctx.shadowBlur = 0;

            // 7. Swipe arrows
            if (showSwipe) {
                ctx.textAlign = 'right';
                ctx.font = '900 italic 45px "Inter", sans-serif'; // Further reduced size as requested
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText('>>', canvas.width - 80, 1320); // Positioned at bottom (outside 1:1 safe zone but user requested bottom)
                ctx.shadowBlur = 0;
            }

            // 8. Real Logo Top Right
            try {
                const logo = new Image();
                logo.src = '/Logo.png';
                await new Promise((resolve) => {
                    logo.onload = resolve;
                    logo.onerror = resolve;
                });
                if (logo.complete && logo.width > 0) {
                    const logoW = 320;
                    const logoH = (logo.height * logoW) / logo.width;
                    ctx.drawImage(logo, canvas.width - logoW - 60, 200, logoW, logoH);
                }
            } catch (e) {
                console.warn("Logo load failed, skipping");
            }

        } catch (e) {
            console.error("Studio drawing error:", e);
        }
    };

    useEffect(() => {
        generateImage();
    }, [bgImage, customText, theme, showSwipe]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBgImage(url);
        }
    };

    const addVisualToList = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setVisualsList([...visualsList, dataUrl]);
    };

    const removeVisual = (index: number) => {
        setVisualsList(visualsList.filter((_, i) => i !== index));
    };

    const downloadSingle = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDownloading(true);
        const link = document.createElement('a');
        link.download = `dropsiders - ${theme.toLowerCase()} -${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        setTimeout(() => setIsDownloading(false), 1000);
    };

    const downloadAll = async () => {
        if (visualsList.length === 0) return;
        setIsDownloading(true);

        // Sequential download for all visuals
        for (let i = 0; i < visualsList.length; i++) {
            const link = document.createElement('a');
            link.download = `dropsiders - pack - ${i + 1}.png`;
            link.href = visualsList[i];
            link.click();
            // Small delay to prevent browser from blocking multiple triggers
            await new Promise(r => setTimeout(r, 300));
        }

        setIsDownloading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#050505] border border-white/10 rounded-[40px] w-full max-w-[1400px] h-[95vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
                {/* Header Section */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-neon-red/10 border border-neon-red/20 rounded-xl flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-neon-red" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Social <span className="text-neon-red">Suite V2</span></h2>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Premium Content Hub</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {visualsList.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/20 rounded-xl">
                                <span className="text-[10px] font-black text-neon-red uppercase tracking-widest">{visualsList.length} VISUELS PRÊTS</span>
                            </div>
                        )}
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Sidebar Editor */}
                    <div className="w-full lg:w-[400px] border-r border-white/5 p-6 overflow-y-auto space-y-8 custom-scrollbar">

                        {/* 1. Theme Choice */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-neon-red">
                                <Layout className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Thème de la publication</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(themeColors) as ThemeType[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`py - 3 rounded - xl text - [9px] font - black uppercase tracking - widest transition - all border ${theme === t
                                                ? 'bg-white text-black shadow-lg scale-[1.02]'
                                                : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                                            } `}
                                        style={theme === t ? { borderBottom: `4px solid ${themeColors[t].label} ` } : {}}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Text Input */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-neon-cyan">
                                <Type className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Texte de l'article</span>
                            </div>
                            <textarea
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                                placeholder="FRAUDEURS DE FESTIVAL... @ENTRÉE POUR LIGNE"
                                className="w-full h-28 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold italic resize-none focus:outline-none focus:border-neon-cyan/50 transition-colors uppercase"
                            />
                        </div>

                        {/* 3. Swipe Option */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between cursor-pointer group" onClick={() => setShowSwipe(!showSwipe)}>
                            <div className="flex items-center gap-3">
                                <div className={`w - 10 h - 10 rounded - xl flex items - center justify - center transition - all ${showSwipe ? 'bg-neon-red/20 text-neon-red' : 'bg-white/5 text-gray-600'} `}>
                                    <Layout className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Logo Swipe</p>
                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Ajouter {">>"} en bas</p>
                                </div>
                            </div>
                            <div className={`w - 10 h - 5 rounded - full relative transition - all ${showSwipe ? 'bg-neon-red' : 'bg-gray-800'} `}>
                                <div className={`absolute top - 0.5 w - 4 h - 4 rounded - full bg - white transition - all ${showSwipe ? 'right-0.5' : 'left-0.5'} `} />
                            </div>
                        </div>

                        {/* 4. Photo Upload */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-neon-purple">
                                <PlusCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Photo de fond</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-white/30 hover:bg-white/5 transition-all group"
                                >
                                    <Upload className="w-6 h-6 text-gray-500 group-hover:text-white" />
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Modifier le fond</span>
                                </button>
                                {bgImage && (
                                    <button
                                        onClick={() => setBgImage('')}
                                        className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Supprimer la photo
                                    </button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            </div>
                        </div>

                        {/* 5. Production Queue */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={addVisualToList}
                                    className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                                >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    Ajouter
                                </button>
                                <button
                                    onClick={downloadSingle}
                                    className="py-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Télécharger
                                </button>
                            </div>

                            {visualsList.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pb-2">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ma Collection</span>
                                        <button onClick={() => setVisualsList([])} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Vider</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {visualsList.map((src, i) => (
                                            <div key={i} className="relative aspect-[3/4] bg-white/5 rounded-lg overflow-hidden border border-white/10 group">
                                                <img src={src} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeVisual(i)}
                                                    className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={downloadAll}
                                        className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <Layers className="w-4 h-4" />
                                        Tout Télécharger ({visualsList.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Canvas Section */}
                    <div className="flex-1 bg-[#020202] p-6 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />

                        <div className="h-full w-full max-w-[500px] flex flex-col gap-6">
                            <div className="flex-1 relative group">
                                <div className="absolute -inset-2 bg-gradient-to-r from-neon-red/10 via-neon-purple/10 to-neon-cyan/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="w-full h-full bg-[#111] rounded-[40px] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative">
                                    <canvas ref={canvasRef} className="w-full h-full object-contain" />
                                    <div className="absolute top-4 left-4 flex items-center gap-2">
                                        <div className="bg-black/60 backdrop-blur-md text-[8px] font-black text-white/80 px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">
                                            VUES D'ARTISTE HDR
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={downloadSingle}
                                className="w-full py-5 bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                {isDownloading ? 'EXPORT EN COURS...' : 'TÉLÉCHARGER CE VISUEL'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
