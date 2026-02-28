import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Instagram, Share2, Upload, Type, Layout, Image as ImageIcon } from 'lucide-react';

interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    onClose: () => void;
}

type TemplateType = 'news_only' | 'news_swipe' | 'musique';

export function SocialSuite({ title, imageUrl, onClose }: SocialSuiteProps) {
    const [template, setTemplate] = useState<TemplateType>('news_only');
    const [customText, setCustomText] = useState(title.toUpperCase());
    const [bgImage, setBgImage] = useState<string>(imageUrl);
    const [isDownloading, setIsDownloading] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !bgImage) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = bgImage;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Set canvas size (Post 1080x1440)
            canvas.width = 1080;
            canvas.height = 1440;

            // 1. Draw Background
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // 2. Draw Gradient Overlay (Matches user visuals)
            const grad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
            const isMusique = template === 'musique';
            // Neon Red for News, Neon Pink/Musique gradient
            const baseColor = isMusique ? '238, 42, 123' : '177, 18, 65';

            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
            grad.addColorStop(0.8, `rgba(${baseColor}, 0.8)`);
            grad.addColorStop(1, `rgba(${baseColor}, 1)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);

            // 3. Scanlines effect
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < canvas.height; i += 6) {
                ctx.fillRect(0, i, canvas.width, 2);
            }

            // 4. Label "NEWS" or "MUSIQUE"
            const label = isMusique ? 'MUSIQUE' : 'NEWS';
            const labelBg = isMusique ? '#ee2a7b' : '#FF1241';

            ctx.font = 'bold 80px "Inter", sans-serif';
            const labelMetrics = ctx.measureText(label);
            const labelWidth = labelMetrics.width + 120;
            const labelY = canvas.height * 0.72;

            ctx.fillStyle = labelBg;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 30;
            ctx.fillRect(0, labelY - 90, labelWidth, 120);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 italic 85px "Inter", sans-serif';
            ctx.fillText(label, 60, labelY);

            // 5. Centered Custom Text (Using "Built Bold" style)
            ctx.fillStyle = '#ffffff';
            // Using Built Bold if available, fallback to heavy Inter
            ctx.font = '900 italic 100px "Built Bold", "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = canvas.width - 200;
            const words = customText.split(' ');
            let lines = [];
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

            const totalHeight = lines.length * 120;
            let startY = (canvas.height / 2) - (totalHeight / 2) + 100; // Centered vertically, offset down a bit

            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 20;

            lines.forEach((line, i) => {
                ctx.fillText(line.toUpperCase(), canvas.width / 2, startY + (i * 120));
            });
            ctx.shadowBlur = 0;

            // 6. Swipe arrows (Template 3)
            if (template === 'news_swipe') {
                ctx.textAlign = 'right';
                ctx.font = '900 italic 120px "Inter", sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('>>', canvas.width - 80, canvas.height - 150);
            }

            // 7. Logo Top Right
            ctx.textAlign = 'right';
            ctx.font = '900 45px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText('DROPSIDERS.EU', canvas.width - 80, 100);

        } catch (e) {
            console.error("Studio drawing error:", e);
        }
    };

    useEffect(() => {
        generateImage();
    }, [bgImage, customText, template]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBgImage(url);
        }
    };

    const download = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDownloading(true);
        const link = document.createElement('a');
        link.download = `dropsiders-post.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        setTimeout(() => setIsDownloading(false), 1000);
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
                className="bg-[#050505] border border-white/10 rounded-[40px] w-full max-w-[1200px] h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
                {/* Header Section */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neon-red/10 border border-neon-red/20 rounded-2xl flex items-center justify-center">
                            <Share2 className="w-6 h-6 text-neon-red" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Social <span className="text-neon-red">Builder</span></h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Custom Story Visuals</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Sidebar Editor */}
                    <div className="w-full lg:w-[450px] border-r border-white/5 p-8 overflow-y-auto space-y-10 custom-scrollbar">

                        {/* 1. Template Choice */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-neon-red">
                                <Layout className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Type de Visuel</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'news_only', label: 'News' },
                                    { id: 'musique', label: 'Music' },
                                    { id: 'news_swipe', label: 'Swipe' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTemplate(t.id as TemplateType)}
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${template === t.id
                                            ? 'bg-neon-red border-neon-red text-white shadow-[0_0_20px_rgba(255,18,65,0.3)]'
                                            : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Text Input */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-neon-red">
                                <Type className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Texte Central</span>
                            </div>
                            <textarea
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                                placeholder="Votre message ici..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-lg font-black italic resize-none focus:outline-none focus:border-neon-red/50 transition-colors uppercase"
                            />
                        </div>

                        {/* 3. Photo Upload */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-neon-red">
                                <ImageIcon className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Image de fond</span>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-12 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-neon-red/50 hover:bg-neon-red/5 transition-all group"
                            >
                                <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-neon-red" />
                                </div>
                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Télécharger une photo</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        {/* Export Buttons */}
                        <div className="pt-6">
                            <button
                                onClick={download}
                                className="w-full py-6 bg-white text-black rounded-3xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                            >
                                <Download className="w-5 h-5" />
                                {isDownloading ? 'Génération...' : 'Télécharger Post'}
                            </button>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <button className="py-4 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                                    <Instagram className="w-4 h-4" /> Insta Share
                                </button>
                                <button className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                    <Share2 className="w-4 h-4" /> Autre
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview Canvas Section */}
                    <div className="flex-1 bg-black p-8 flex items-center justify-center relative overflow-hidden group">
                        {/* Mesh background effect */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-red/5 via-transparent to-transparent pointer-events-none" />

                        <div className="h-full max-h-full aspect-[1080/1440] relative">
                            <div className="absolute -inset-4 bg-neon-red/20 blur-[60px] opacity-20 pointer-events-none" />
                            <div className="w-full h-full bg-[#111] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative">
                                <canvas ref={canvasRef} className="w-full h-full object-contain" />

                                {/* Overlay Helper */}
                                <div className="absolute top-4 left-4 text-[8px] font-black bg-black/60 text-white px-2 py-1 rounded border border-white/10 uppercase tracking-widest">
                                    Prévisualisation HD (1080x1440)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
