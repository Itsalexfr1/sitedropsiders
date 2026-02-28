import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Copy, Check, Instagram, Share2 } from 'lucide-react';

interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    type: string;
    category: string;
    onClose: () => void;
    articleId: string;
}

type TemplateType = 'standard' | 'news_swipe' | 'news_only' | 'musique';

export function SocialSuite({ title, imageUrl, type, category, onClose, articleId }: SocialSuiteProps) {
    const [copied, setCopied] = useState(false);
    const [template, setTemplate] = useState<TemplateType>('standard');
    const storyCanvasRef = useRef<HTMLCanvasElement>(null);
    const postCanvasRef = useRef<HTMLCanvasElement>(null);

    const shareUrl = `${window.location.origin}/news/${articleId}`;
    const promoText = `🎙️ NOUVEL ARTICLE : ${title.toUpperCase()}\n\nDécouvrez notre dernier reportage sur Dropsiders !\n\nLien en bio 🔗\n#dropsiders #festival #techno #hardstyle #edm`;

    const generateImages = async () => {
        if (!imageUrl) return;

        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const drawTemplate = (ctx: CanvasRenderingContext2D, width: number, height: number, isStory: boolean) => {
                // 1. Background Image
                const scale = Math.max(width / img.width, height / img.height);
                const x = (width - img.width * scale) / 2;
                const y = (height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                if (template === 'standard') {
                    // Original Premium Template
                    const grad = ctx.createLinearGradient(0, height * 0.4, 0, height);
                    grad.addColorStop(0, 'rgba(0,0,0,0)');
                    grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
                    grad.addColorStop(1, '#000000');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, width, height);

                    // Category Banner
                    const accentColor = type === 'Interview' ? '#BF00FF' : category === 'Musique' ? '#39FF14' : '#FF1241';
                    ctx.fillStyle = accentColor;
                    const bannerY = isStory ? 1450 : 800;
                    ctx.fillRect(isStory ? 80 : 60, bannerY, 200, 50);
                    ctx.fillStyle = category === 'Musique' ? '#000000' : '#ffffff';
                    ctx.font = 'black 30px Inter, sans-serif';
                    ctx.fillText(type.toUpperCase(), isStory ? 100 : 80, bannerY + 35);

                    // Title
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `black italic ${isStory ? '80px' : '60px'} Inter, sans-serif`;
                    const words = title.split(' ');
                    let line = '';
                    let yPos = isStory ? 1600 : 880;
                    const maxWidth = width - (isStory ? 160 : 120);
                    const lineHeight = isStory ? 100 : 70;

                    for (let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + ' ';
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth && n > 0) {
                            ctx.fillText(line.toUpperCase(), isStory ? 80 : 60, yPos);
                            line = words[n] + ' ';
                            yPos += lineHeight;
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.fillText(line.toUpperCase(), isStory ? 80 : 60, yPos);
                } else {
                    // NEWS / MUSIQUE Templates (Inspired by user image)
                    // Multi-layer gradient for depth
                    const grad = ctx.createLinearGradient(0, height * 0.4, 0, height);
                    const baseColor = template === 'musique' ? '57, 255, 20' : '177, 18, 65'; // Neon Green for Musique, Neon Red for News
                    grad.addColorStop(0, 'rgba(0,0,0,0)');
                    grad.addColorStop(0.2, 'rgba(0,0,0,0.3)');
                    grad.addColorStop(0.7, `rgba(${baseColor}, 0.7)`);
                    grad.addColorStop(1, `rgba(${baseColor}, 1)`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, height * 0.3, width, height * 0.7);

                    // Scanlines effect for premium feel
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < height; i += 4) {
                        ctx.fillRect(0, i, width, 1);
                    }

                    // Label "NEWS" or "MUSIQUE" with slant
                    const label = template === 'musique' ? 'MUSIQUE' : 'NEWS';
                    const labelBg = template === 'musique' ? '#39FF14' : '#FF1241';
                    const textColor = template === 'musique' ? '#000000' : '#ffffff';

                    ctx.font = 'black 60px Inter, sans-serif';
                    const metrics = ctx.measureText(label);
                    const labelWidth = metrics.width + 100;

                    const labelY = height * 0.72;
                    ctx.fillStyle = labelBg;

                    // Shadow for label
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 20;
                    ctx.fillRect(0, labelY - 75, labelWidth, 100);
                    ctx.shadowBlur = 0;

                    ctx.fillStyle = textColor;
                    ctx.font = 'black italic 65px Inter, sans-serif';
                    ctx.fillText(label, 40, labelY);

                    // Title (White, Under the label area)
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `black italic ${isStory ? '85px' : '65px'} Inter, sans-serif`;
                    const words = title.split(' ');
                    let line = '';
                    let yPos = labelY + 110;
                    const maxWidth = width - 120;
                    const lineHeight = isStory ? 100 : 75;

                    for (let n = 0; n < words.length; n++) {
                        const testLine = line + words[n] + ' ';
                        const metricsLine = ctx.measureText(testLine);
                        if (metricsLine.width > maxWidth && n > 0) {
                            ctx.shadowColor = 'rgba(0,0,0,0.8)';
                            ctx.shadowBlur = 15;
                            ctx.fillText(line.toUpperCase(), 40, yPos);
                            line = words[n] + ' ';
                            yPos += lineHeight;
                        } else {
                            line = testLine;
                        }
                    }
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 15;
                    ctx.fillText(line.toUpperCase(), 40, yPos);
                    ctx.shadowBlur = 0;

                    // Swipe Arrows >>
                    if (template === 'news_swipe') {
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'black italic 80px Inter, sans-serif';
                        ctx.shadowColor = '#000000';
                        ctx.shadowBlur = 10;
                        ctx.fillText('>>', width - 150, height - 100);

                        ctx.font = 'black uppercase 20px Inter, sans-serif';
                        ctx.fillText('SWIPE', width - 155, height - 60);
                        ctx.shadowBlur = 0;
                    }
                }


                // Global Top-Right Logo (White outline style if possible, or simple text)
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = 'bold 40px Inter, sans-serif';
                const logoText = 'DROPSIDERS.FR';
                const logoWidth = ctx.measureText(logoText).width;
                ctx.fillText(logoText, width - logoWidth - 50, 80);
            };

            // STORY
            if (storyCanvasRef.current) {
                const ctx = storyCanvasRef.current.getContext('2d');
                if (ctx) drawTemplate(ctx, 1080, 1920, true);
            }

            // POST
            if (postCanvasRef.current) {
                const ctx = postCanvasRef.current.getContext('2d');
                if (ctx) drawTemplate(ctx, 1080, 1080, false);
            }

        } catch (e) {
            console.error("Error generating social assets:", e);
        }
    };

    useEffect(() => {
        generateImages();
    }, [imageUrl, title, template]);

    const download = (canvas: HTMLCanvasElement | null, filename: string) => {
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToInstagram = async () => {
        try {
            const canvas = postCanvasRef.current;
            if (!canvas) return;
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) return;
            const file = new File([blob], `dropsiders-${articleId}.png`, { type: 'image/png' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: title, text: promoText });
            } else {
                window.open('https://www.instagram.com/reels/create/', '_blank');
            }
        } catch (err) {
            console.error('Error sharing:', err);
            window.open('https://www.instagram.com/', '_blank');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 rounded-[32px] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-2xl font-display font-black text-white italic uppercase tracking-tighter">Social <span className="text-neon-red">Studio</span></h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Générez vos visuels premium</p>
                    </div>

                    {/* Template Selection */}
                    <div className="hidden md:flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                        {[
                            { id: 'standard', label: 'Premium' },
                            { id: 'news_swipe', label: 'News Swipe' },
                            { id: 'news_only', label: 'News Simple' },
                            { id: 'musique', label: 'Musique' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTemplate(t.id as TemplateType)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${template === t.id
                                    ? 'bg-neon-red text-white shadow-lg'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Mobile Template Selector */}
                    <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-none">
                        {[
                            { id: 'standard', label: 'Premium' },
                            { id: 'news_swipe', label: 'News Swipe' },
                            { id: 'news_only', label: 'News Simple' },
                            { id: 'musique', label: 'Musique' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTemplate(t.id as TemplateType)}
                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${template === t.id
                                    ? 'bg-neon-red text-white'
                                    : 'bg-white/5 text-gray-500'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Visuals Previews */}
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Story Card */}
                                <div className="flex-1 space-y-3">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center">Story (9:16)</div>
                                    <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative group">
                                        <canvas ref={storyCanvasRef} width={1080} height={1920} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => download(storyCanvasRef.current, `story-${articleId}.png`)}
                                                className="p-4 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all font-black"
                                            >
                                                <Download className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => download(storyCanvasRef.current, `story-${articleId}.png`)}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Download className="w-4 h-4" /> Story
                                    </button>
                                </div>

                                {/* Post Card */}
                                <div className="flex-1 space-y-3">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center">Post (1:1)</div>
                                    <div className="aspect-square bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative group">
                                        <canvas ref={postCanvasRef} width={1080} height={1080} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => download(postCanvasRef.current, `post-${articleId}.png`)}
                                                className="p-4 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all font-black"
                                            >
                                                <Download className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => download(postCanvasRef.current, `post-${articleId}.png`)}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Download className="w-4 h-4" /> Post
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Copier Text/Link */}
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-neon-red mb-4">Lien de l'article</div>
                                    <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5 overflow-hidden">
                                        <span className="text-gray-400 text-xs truncate flex-1">{shareUrl}</span>
                                        <button
                                            onClick={() => copyToClipboard(shareUrl)}
                                            className="p-2 bg-white/5 hover:bg-neon-red hover:text-white rounded-lg transition-all"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-neon-red">Texte Promotionnel</div>
                                        <button
                                            onClick={() => copyToClipboard(promoText)}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black flex items-center gap-2 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                        >
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied ? 'COPIÉ' : 'COPIER TOUT'}
                                        </button>
                                    </div>
                                    <textarea
                                        readOnly
                                        value={promoText}
                                        className="w-full h-40 bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-gray-300 resize-none font-sans leading-relaxed"
                                    />
                                </div>

                                <div className="pt-4 grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        onClick={shareToInstagram}
                                        className="flex items-center justify-center gap-2 py-4 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        Partager Insta
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({ title: title, url: shareUrl, text: promoText });
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        <Share2 className="w-5 h-5" />
                                        Partage Natif
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
