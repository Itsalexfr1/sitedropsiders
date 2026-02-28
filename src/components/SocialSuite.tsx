import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    X, Download, Upload, PlusCircle,
    Video, Layout, Smartphone, Image as ImageIcon
} from 'lucide-react';

interface SocialSuiteProps {
    title: string;
    imageUrl: string;
    onClose: () => void;
}

type TabType = 'REEL' | 'PUBLICATION';
type ThemeType = 'TOP 5 ARTISTE' | 'TOP 5 STYLES' | 'INTRO' | 'NEWS' | 'FOCUS' | 'MUSIQUE' | 'RECAP';

interface Top5Item {
    main: string; // Artist or Genre
    sub: string;  // Song or Description
    value: string; // Streams or Percent
    spotifyUrl?: string;
}

const COLOR_PRESETS = [
    { name: 'ROUGE', grad: '255, 0, 51', color: '#ff0033' },
    { name: 'BLEU', grad: '0, 50, 255', color: '#0032ff' },
    { name: 'CYAN', grad: '0, 240, 255', color: '#00f0ff' },
    { name: 'VERT', grad: '57, 255, 20', color: '#39ff14' },
    { name: 'ORANGE', grad: '255, 170, 0', color: '#ffaa00' },
    { name: 'VIOLET', grad: '189, 0, 255', color: '#bd00ff' }
];

export function SocialSuite({ title, imageUrl, onClose }: SocialSuiteProps) {
    const [activeTab, setActiveTab] = useState<TabType>('PUBLICATION');
    const [theme, setTheme] = useState<ThemeType>('NEWS');
    const [showSwipe, setShowSwipe] = useState(false);
    const [customText, setCustomText] = useState((title || '').toUpperCase());
    const [bgImage, setBgImage] = useState<string>(imageUrl);
    const [bgVideo, setBgVideo] = useState<HTMLVideoElement | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [visualsList, setVisualsList] = useState<string[]>([]);

    // Theme Color state
    const [themeColor, setThemeColor] = useState<typeof COLOR_PRESETS[0] | null>(null);

    // For Top 5
    const [top5Items, setTop5Items] = useState<Top5Item[]>(Array.from({ length: 5 }, () => ({
        main: 'ARTISTE',
        sub: 'TITRE DU MORCEAU',
        value: '50',
        spotifyUrl: ''
    })));
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

    // Animation state for disc rotation
    const [rotation, setRotation] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const baseThemeData: Record<ThemeType, { label: string; grad: string; color: string }> = {
        'TOP 5 ARTISTE': { label: 'TOP 5 ARTISTES', grad: '255, 18, 65', color: '#ff1241' },
        'TOP 5 STYLES': { label: 'TOP 5 STYLES', grad: '0, 240, 255', color: '#00f0ff' },
        'NEWS': { label: 'NEWS', grad: '255, 0, 51', color: '#ff0033' },
        'FOCUS': { label: 'FOCUS', grad: '255, 170, 0', color: '#ffaa00' },
        'MUSIQUE': { label: 'MUSIQUE', grad: '57, 255, 20', color: '#39ff14' },
        'RECAP': { label: 'RECAP', grad: '189, 0, 255', color: '#bd00ff' },
        'INTRO': { label: 'INTRO', grad: '0, 50, 255', color: '#0032ff' }
    };

    // Tab Change Reset
    useEffect(() => {
        if (activeTab === 'REEL') setTheme('TOP 5 ARTISTE');
        else setTheme('NEWS');
        setThemeColor(null); // Reset manual color on tab change
    }, [activeTab]);

    // Update active color based on manual selection or theme default
    const activeColor = themeColor || (themeDataOverride() || baseThemeData[theme]);

    function themeDataOverride() {
        return themeColor ? { label: theme, ...themeColor } : null;
    }

    // Rotation Animation
    useEffect(() => {
        let frame: number;
        if (theme === 'TOP 5 STYLES' && isVideoRecording) {
            const animate = () => {
                setRotation(prev => (prev + 0.05) % (Math.PI * 2));
                frame = requestAnimationFrame(animate);
            };
            frame = requestAnimationFrame(animate);
        } else {
            setRotation(0);
        }
        return () => cancelAnimationFrame(frame);
    }, [theme, isVideoRecording]);

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
                await new Promise((res, rej) => { img!.onload = res; img!.onerror = rej; });
            }

            // Dimensions
            canvas.width = 1080;
            canvas.height = activeTab === 'REEL' ? 1920 : 1440;

            const safeTop = (canvas.height - 1080) / 2;
            const safeBottom = safeTop + 1080;

            // 1. Background (Video or Image)
            if (bgVideo) {
                const scale = Math.max(canvas.width / bgVideo.videoWidth, canvas.height / bgVideo.videoHeight);
                const x = (canvas.width - bgVideo.videoWidth * scale) / 2;
                const y = (canvas.height - bgVideo.videoHeight * scale) / 2;
                ctx.drawImage(bgVideo, x, y, bgVideo.videoWidth * scale, bgVideo.videoHeight * scale);
            } else if (img) {
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            } else {
                ctx.fillStyle = '#050505';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // 2. Gradients
            const activeData = activeColor;
            const grad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
            grad.addColorStop(0.8, `rgba(${activeData.grad}, 0.6)`);
            grad.addColorStop(1, `rgba(${activeData.grad}, 0.9)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);

            // 3. Scanlines
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < canvas.height; i += 6) ctx.fillRect(0, i, canvas.width, 2);

            // 4. Layouts
            if (theme === 'INTRO') {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.shadowColor = `rgba(${activeData.grad}, 0.5)`;
                ctx.shadowBlur = 30;
                const tapeW = 900;
                const tapeH = 260;
                ctx.fillStyle = activeData.color;
                ctx.beginPath();
                ctx.moveTo(-tapeW / 2 - 20, -tapeH / 2 + 10);
                ctx.lineTo(tapeW / 2 + 20, -tapeH / 2 - 10);
                ctx.lineTo(tapeW / 2 + 40, tapeH / 2 + 5);
                ctx.lineTo(-tapeW / 2 - 30, tapeH / 2 - 5);
                ctx.closePath();
                ctx.fill();
                const plasticGrad = ctx.createLinearGradient(-tapeW / 2, -tapeH / 2, tapeW / 2, tapeH / 2);
                plasticGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
                plasticGrad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
                plasticGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
                ctx.fillStyle = plasticGrad;
                ctx.fill();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const fontSize = 70;
                ctx.font = `900 italic ${fontSize}px "Inter", sans-serif`;
                const textGrad = ctx.createLinearGradient(0, -tapeH / 2, 0, tapeH / 2);
                textGrad.addColorStop(0, '#ffffff');
                textGrad.addColorStop(0.4, '#e0e0e0');
                textGrad.addColorStop(0.5, '#a0a0a0');
                textGrad.addColorStop(0.6, '#e0e0e0');
                textGrad.addColorStop(1, '#ffffff');
                ctx.fillStyle = textGrad;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 10;
                const lines = customText.split('\n');
                lines.forEach((line, i) => {
                    ctx.fillText(line.toUpperCase(), 0, (i - (lines.length - 1) / 2) * fontSize * 1.1);
                });
                ctx.restore();

            } else if (theme === 'TOP 5 STYLES') {
                const item = top5Items[currentPreviewIndex];
                const centerX = canvas.width / 2;
                const centerY = safeTop + 480;
                const radius = 350;
                if (img) {
                    ctx.save();
                    ctx.shadowColor = `rgba(${activeData.grad}, 0.5)`;
                    ctx.shadowBlur = 40;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.clip();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(rotation);
                    const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
                    ctx.drawImage(img, -(img.width * scale) / 2, -(img.height * scale) / 2, img.width * scale, img.height * scale);
                    ctx.restore();
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fill();
                    ctx.strokeStyle = activeData.color;
                    ctx.lineWidth = 10;
                    ctx.stroke();
                }
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 80px "Inter", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 15;
                ctx.fillText(item.main.toUpperCase(), centerX, centerY + radius + 120);
                ctx.textAlign = 'right';
                ctx.font = '900 italic 150px "Inter", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100, canvas.height - 150);

            } else if (theme === 'TOP 5 ARTISTE') {
                const item = top5Items[currentPreviewIndex];
                const baseY = 1500;
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 italic 52px "Inter", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.fillText(`${item.main} - ${item.sub}`.toUpperCase(), 100, baseY);
                const barWidth = 880;
                const barHeight = 90;
                const barX = 90;
                const barY = baseY + 45;
                ctx.fillStyle = `rgba(${activeData.grad}, 0.4)`;
                ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20);
                ctx.fillStyle = activeData.color;
                ctx.fillRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle = '#fff';
                ctx.font = '900 italic 46px "Inter", sans-serif';
                ctx.fillText(`${item.value} MILLIONS DE STREAMS`, barX + 30, barY + 60);
                ctx.textAlign = 'right';
                ctx.font = '900 italic 120px "Inter", sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                ctx.fillText(`#${5 - currentPreviewIndex}`, canvas.width - 100, canvas.height - 150);

            } else {
                const fontSize = 85;
                const lineHeight = fontSize * 1.2;
                ctx.textAlign = 'center';

                // Content splitting preserving manual line breaks
                const paragraphs = customText.split('\n');
                let lines: string[] = [];
                ctx.font = `900 italic ${fontSize}px "Inter", sans-serif`;

                for (let para of paragraphs) {
                    if (para.trim() === '') {
                        lines.push(''); // Preserve empty lines
                        continue;
                    }
                    const words = para.split(' ');
                    let currentLine = '';
                    for (let word of words) {
                        if (ctx.measureText(currentLine + word).width < canvas.width - 200) {
                            currentLine += word + ' ';
                        } else {
                            lines.push(currentLine.trim());
                            currentLine = word + ' ';
                        }
                    }
                    lines.push(currentLine.trim());
                }

                const labelY = safeTop + 150; // Place label high
                const startY = labelY + 180; // Text starts clearly below the label

                // Theme Label Box
                ctx.fillStyle = activeData.color;
                const labelText = ('label' in activeData) ? activeData.label : themeDataOverride()?.label || theme;
                const labelW = ctx.measureText(labelText).width + 80;
                ctx.fillRect((canvas.width - labelW) / 2, labelY - 50, labelW, 80);

                // Label text - Black if it's MUSIQUE or FOCUS
                ctx.fillStyle = (theme === 'MUSIQUE' || theme === 'FOCUS') ? '#000' : '#fff';
                ctx.font = '900 italic 50px "Inter", sans-serif';
                ctx.fillText(labelText, canvas.width / 2, labelY + 5);

                // Main Content Lines
                ctx.font = `900 italic ${fontSize}px "Inter", sans-serif`;
                ctx.fillStyle = '#fff';
                lines.forEach((line, i) => {
                    if (line !== '') {
                        ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight));
                    }
                });
            }

            // DROPSIDERS Logo
            try {
                const logo = new Image();
                logo.src = '/Logo.png';
                await new Promise(r => { logo.onload = r; logo.onerror = r; });
                if (logo.complete && logo.width > 0) {
                    const w = 320;
                    ctx.drawImage(logo, canvas.width - w - 40, 40, w, (logo.height * w) / logo.width);
                }
            } catch { }

            // Swipe
            if (showSwipe) {
                ctx.textAlign = 'right';
                ctx.font = '900 italic 38px "Inter", sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('>>', canvas.width - 80, safeBottom - 20);
            }

        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        let anim: number;
        if (bgVideo || (theme === 'TOP 5 STYLES' && isVideoRecording)) {
            const loop = () => {
                generateImage();
                anim = requestAnimationFrame(loop);
            };
            anim = requestAnimationFrame(loop);
        } else {
            generateImage();
        }
        return () => cancelAnimationFrame(anim);
    }, [bgImage, bgVideo, customText, theme, showSwipe, top5Items, currentPreviewIndex, activeTab, rotation, themeColor]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = url;
            video.muted = true;
            video.loop = true;
            video.play();
            setBgVideo(video);
            setBgImage('');
        } else {
            setBgImage(url);
            setBgVideo(null);
        }
    };

    const startVideoRecording = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsVideoRecording(true);
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dropsiders-${theme.replace(/ /g, '-')}-${Date.now()}.webm`;
            a.click();
            setIsVideoRecording(false);
        };
        recorder.start();
        for (let i = 0; i < 5; i++) {
            setCurrentPreviewIndex(i);
            await new Promise(r => setTimeout(r, 12000));
        }
        recorder.stop();
    };

    const addVisualToList = () => {
        if (!canvasRef.current) return;
        setVisualsList([...visualsList, canvasRef.current.toDataURL('image/png')]);
    };

    const downloadSingle = () => {
        if (!canvasRef.current) return;
        setIsDownloading(true);
        const a = document.createElement('a');
        a.download = `dropsiders-${theme}-${Date.now()}.png`;
        a.href = canvasRef.current.toDataURL('image/png');
        a.click();
        setTimeout(() => setIsDownloading(false), 1000);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0a0a0a] w-full max-w-6xl h-[90vh] rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row">

                <div className="w-full lg:w-[400px] border-r border-white/10 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter">SOCIAL STUDIO</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Générateur de publications</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                        <button onClick={() => setActiveTab('REEL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'REEL' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><Smartphone className="w-4 h-4" /> REEL</button>
                        <button onClick={() => setActiveTab('PUBLICATION')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'PUBLICATION' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}><ImageIcon className="w-4 h-4" /> PUBLICATION</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {activeTab === 'REEL' ? (
                            <>
                                <button onClick={() => setTheme('INTRO')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'INTRO' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-white/5 border-white/5 text-gray-400'}`}>INTRO</button>
                                <button onClick={() => setTheme('TOP 5 ARTISTE')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'TOP 5 ARTISTE' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 ARTISTES</button>
                                <button onClick={() => setTheme('TOP 5 STYLES')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'TOP 5 STYLES' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-white/5 border-white/5 text-gray-400'}`}>TOP 5 STYLES</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setTheme('NEWS')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'NEWS' ? 'bg-neon-red/20 border-neon-red text-neon-red' : 'bg-white/5 border-white/5 text-gray-400'}`}>NEWS</button>
                                <button onClick={() => setTheme('FOCUS')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'FOCUS' ? 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00]' : 'bg-white/5 border-white/5 text-gray-400'}`}>FOCUS</button>
                                <button onClick={() => setTheme('MUSIQUE')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'MUSIQUE' ? 'bg-neon-green/20 border-neon-green text-neon-green' : 'bg-white/5 border-white/5 text-gray-400'}`}>MUSIQUE</button>
                                <button onClick={() => setTheme('RECAP')} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${theme === 'RECAP' ? 'bg-neon-purple/20 border-neon-purple text-neon-purple' : 'bg-white/5 border-white/5 text-gray-400'}`}>RECAP</button>
                            </>
                        )}
                    </div>

                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Couleur du thème</span>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map(c => (
                                <button key={c.name} onClick={() => setThemeColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all ${themeColor?.name === c.name ? 'border-white scale-110' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c.color }} title={c.name} />
                            ))}
                            <button onClick={() => setThemeColor(null)} className="px-2 text-[8px] font-bold text-gray-500 uppercase hover:text-white transition-all">Reset</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {theme.startsWith('TOP 5') ? (
                            <>
                                <span className="text-[10px] font-black text-gray-500 uppercase">Éléments du Top 5</span>
                                <div className="space-y-4">
                                    {top5Items.map((item, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer ${currentPreviewIndex === i ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/5'}`} onClick={() => setCurrentPreviewIndex(i)}>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <input value={item.main} onChange={e => { const n = [...top5Items]; n[i].main = e.target.value.toUpperCase(); setTop5Items(n); }} placeholder={theme.includes('STYLES') ? "NOM DU STYLE" : "ARTISTE"} className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                                <input value={item.sub} onChange={e => { const n = [...top5Items]; n[i].sub = e.target.value.toUpperCase(); setTop5Items(n); }} placeholder={theme.includes('STYLES') ? "DESCRIPTION" : "TITRE"} className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold" />
                                            </div>
                                            {theme === 'TOP 5 ARTISTE' && (
                                                <input value={item.value} onChange={e => { const n = [...top5Items]; n[i].value = e.target.value; setTop5Items(n); }} placeholder="STREAMS (MILLIONS)" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-white font-bold mb-2" />
                                            )}
                                            <input value={item.spotifyUrl} onChange={e => { const n = [...top5Items]; n[i].spotifyUrl = e.target.value; setTop5Items(n); }} placeholder="LIEN SPOTIFY" className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-[10px] text-[#1DB954] font-bold" />
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-gray-500 uppercase">Contenu</span>
                                <textarea value={customText} onChange={e => setCustomText(e.target.value.toUpperCase())} placeholder="VOTRE TEXTE ICI..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold italic resize-none" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 mt-auto">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setShowSwipe(!showSwipe)}>
                            <div className="flex items-center gap-3"><Layout className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-black text-white uppercase">Swipe</span></div>
                            <div className={`w-8 h-4 rounded-full relative ${showSwipe ? 'bg-neon-red' : 'bg-gray-800'}`}><div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showSwipe ? 'right-0.5' : 'left-0.5'}`} /></div>
                        </div>
                        <div className="space-y-2">
                            {activeTab === 'REEL' ? (
                                <button onClick={startVideoRecording} disabled={isVideoRecording} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 transition-all ${isVideoRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-neon-red/10 border border-neon-red/30 text-neon-red hover:bg-neon-red/20'}`}><Video className="w-4 h-4" /> {isVideoRecording ? 'CAPTURE...' : `Générer Vidéo ${theme}`}</button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={addVisualToList} className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all"><PlusCircle className="w-3.5 h-3.5" /> Ajouter</button>
                                    <button onClick={downloadSingle} disabled={isDownloading} className="py-4 bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-neon-cyan/20 transition-all"><Download className="w-3.5 h-3.5" /> Télécharger</button>
                                </div>
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-500 text-[10px] font-black uppercase hover:border-white/30 transition-all"><Upload className="w-4 h-4" /> Fond Image/Vidéo</button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-[#020202] p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="h-full w-full max-w-[450px] relative">
                        <div className="w-full h-full bg-[#111] rounded-[30px] overflow-hidden border border-white/10 shadow-2xl relative">
                            <canvas ref={canvasRef} className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
