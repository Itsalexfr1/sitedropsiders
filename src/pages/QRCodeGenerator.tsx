import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Download, X, Eye, QrCode, Link, Palette, RefreshCw, Copy } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { ExportSuccessModal } from '../components/ExportSuccessModal';

interface QRCodeGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRESET_URLS = [
    { label: 'Site Principal', url: 'https://www.dropsiders.fr', color: '#00fff3' },
    { label: 'Agenda', url: 'https://www.dropsiders.fr/agenda', color: '#facc15' },
    { label: 'News', url: 'https://www.dropsiders.fr/news', color: '#00fff3' },
    { label: 'Wiki DJs', url: 'https://www.dropsiders.fr/wiki', color: '#a855f7' },
    { label: 'Community', url: 'https://www.dropsiders.fr/community', color: '#f97316' },
];

const DOT_STYLES: { label: string; value: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded' }[] = [
    { label: 'Arrondi', value: 'extra-rounded' },
    { label: 'Points', value: 'dots' },
    { label: 'Classique', value: 'classy-rounded' },
    { label: 'Carré', value: 'square' },
];

export function QRCodeGenerator({ isOpen, onClose }: QRCodeGeneratorProps) {
    const [url, setUrl] = useState('https://www.dropsiders.fr');
    const [fgColor, setFgColor] = useState('#00fff3');
    const [bgColor, setBgColor] = useState('#0a0a0a');
    const [dotStyle, setDotStyle] = useState<typeof DOT_STYLES[0]['value']>('extra-rounded');
    const [withLogo, setWithLogo] = useState(true);
    const [copied, setCopied] = useState(false);
    const [size] = useState(300);
    const [showSuccess, setShowSuccess] = useState(false);
    const [readyBlob, setReadyBlob] = useState<Blob | null>(null);
    const [readyUrl, setReadyUrl] = useState<string>('');
    const [readyFilename, setReadyFilename] = useState('');

    useEffect(() => {
        return () => {
            if (readyUrl) URL.revokeObjectURL(readyUrl);
        };
    }, [readyUrl]);

    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<QRCodeStyling | null>(null);

    const buildQR = useCallback(() => {
        return new QRCodeStyling({
            width: size,
            height: size,
            type: 'canvas',
            data: url || 'https://www.dropsiders.fr',
            image: withLogo ? '/Logo.png' : undefined,
            dotsOptions: {
                color: fgColor,
                type: dotStyle,
            },
            backgroundOptions: {
                color: bgColor,
            },
            cornersSquareOptions: {
                color: fgColor,
                type: 'extra-rounded',
            },
            cornersDotOptions: {
                color: fgColor,
                type: 'dot',
            },
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 3,
                imageSize: 0.40,
            },
            qrOptions: {
                errorCorrectionLevel: 'H',
            },
        });
    }, [url, fgColor, bgColor, dotStyle, withLogo, size]);

    // Initial render
    useEffect(() => {
        if (!isOpen || !qrRef.current) return;
        qrRef.current.innerHTML = '';
        qrInstance.current = buildQR();
        qrInstance.current.append(qrRef.current);
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Update on options change
    useEffect(() => {
        if (!isOpen || !qrRef.current) return;
        qrRef.current.innerHTML = '';
        qrInstance.current = buildQR();
        qrInstance.current.append(qrRef.current);
    }, [url, fgColor, bgColor, dotStyle, withLogo, buildQR, isOpen]);


    const handleExport = async (ext: 'png' | 'svg') => {
        if (!qrInstance.current) return;
        
        const fileName = `dropsiders_qr_${Date.now()}.${ext}`;
        const blob = await qrInstance.current.getRawData(ext);
        
        if (blob) {
            const blobData = blob as Blob;
            const url = URL.createObjectURL(blobData);
            setReadyBlob(blobData);
            setReadyUrl(url);
            setReadyFilename(fileName);
            setShowSuccess(true);
        }
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center md:p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0A0A0A] w-full max-w-5xl h-full md:h-auto md:max-h-[92vh] md:rounded-[3rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative"
                >
                    {/* Accent top bar */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />

                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
                                <QrCode className="w-6 h-6 text-neon-cyan" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">
                                    Générateur <span className="text-neon-cyan">QR Code</span>
                                </h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    QR codes statiques permanents · Valables à vie
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0">
                        {/* Left: Controls */}
                        <div className="p-8 border-r border-white/5 space-y-8 overflow-y-auto custom-scrollbar">

                            {/* URL Input */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Link className="w-3 h-3 text-neon-cyan" /> URL de destination
                                </label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://www.dropsiders.fr"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-medium outline-none focus:border-neon-cyan transition-all pr-14"
                                    />
                                    <button
                                        onClick={copyUrl}
                                        title="Copier le lien"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 hover:bg-neon-cyan/20 text-gray-400 hover:text-neon-cyan transition-all"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-neon-cyan" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Presets */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {PRESET_URLS.map((p) => (
                                        <button
                                            key={p.url}
                                            onClick={() => { setUrl(p.url); setFgColor(p.color); }}
                                            className={`py-2.5 px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all text-left truncate ${url === p.url ? 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Style */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Palette className="w-3 h-3 text-neon-cyan" /> Style des points
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {DOT_STYLES.map((s) => (
                                        <button
                                            key={s.value}
                                            onClick={() => setDotStyle(s.value)}
                                            className={`py-3 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${dotStyle === s.value ? 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Palette className="w-3 h-3 text-neon-cyan" /> Couleurs
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">QR Code</span>
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                                            <input
                                                type="color"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                                            />
                                            <span className="text-white text-xs font-mono">{fgColor}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Fond</span>
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                                            />
                                            <span className="text-white text-xs font-mono">{bgColor}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick color palettes */}
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { fg: '#00fff3', bg: '#0a0a0a', label: 'Cyan' },
                                        { fg: '#a855f7', bg: '#0a0a0a', label: 'Purple' },
                                        { fg: '#facc15', bg: '#0a0a0a', label: 'Gold' },
                                        { fg: '#f97316', bg: '#0a0a0a', label: 'Orange' },
                                        { fg: '#ffffff', bg: '#0a0a0a', label: 'White' },
                                        { fg: '#000000', bg: '#ffffff', label: 'Classic' },
                                    ].map((c) => (
                                        <button
                                            key={c.label}
                                            onClick={() => { setFgColor(c.fg); setBgColor(c.bg); }}
                                            title={c.label}
                                            className="w-8 h-8 rounded-xl border border-white/10 hover:scale-110 transition-all shadow-lg"
                                            style={{ background: `linear-gradient(135deg, ${c.fg} 50%, ${c.bg} 50%)` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Options</label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div
                                        onClick={() => setWithLogo(!withLogo)}
                                        className={`w-12 h-6 rounded-full border relative transition-all ${withLogo ? 'bg-neon-cyan/20 border-neon-cyan/50' : 'bg-white/5 border-white/10'}`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${withLogo ? 'left-6 bg-neon-cyan' : 'left-0.5 bg-white/30'}`} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Logo Dropsiders au centre</span>
                                </label>
                            </div>

                            {/* Info banner */}
                            <div className="p-5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black text-neon-cyan uppercase tracking-widest">✅ QR Code Statique • Valable à vie</p>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    Ce QR code pointe directement vers l'URL sans passer par un service tiers. Il ne peut pas expirer ou être désactivé. Une fois téléchargé, vous pouvez l'imprimer ou le partager librement.
                                </p>
                            </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="p-8 bg-[#050505] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,243,0.04)_0%,transparent_70%)] pointer-events-none" />

                            {/* QR Preview */}
                            <div className="relative">
                                <div
                                    className="rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,255,243,0.15)] border border-white/10 relative z-10"
                                    style={{ background: bgColor }}
                                >
                                    <div ref={qrRef} className="p-1" />
                                </div>
                                {/* Glow */}
                                <div
                                    className="absolute inset-0 rounded-[2rem] blur-2xl opacity-20 -z-0"
                                    style={{ background: fgColor }}
                                />
                            </div>

                            {/* URL display */}
                            <div className="w-full text-center space-y-1">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Destination</p>
                                <p className="text-xs font-bold text-neon-cyan truncate max-w-[300px] mx-auto">{url || '—'}</p>
                            </div>

                            {/* Download buttons */}
                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={() => handleExport('png')}
                                    className="w-full py-4 bg-neon-cyan text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-neon-cyan/20"
                                >
                                    <Download className="w-4 h-4" />
                                    GÉNÉRER PNG
                                </button>
                                <button
                                    onClick={() => handleExport('svg')}
                                    className="w-full py-3 bg-white/5 border border-white/10 text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                    <Download className="w-4 h-4" />
                                    Télécharger SVG (vectoriel)
                                </button>
                                <button
                                    onClick={() => { setUrl('https://www.dropsiders.fr'); setFgColor('#00fff3'); setBgColor('#0a0a0a'); setDotStyle('extra-rounded'); setWithLogo(true); }}
                                    className="w-full py-3 bg-white/5 border border-white/10 text-gray-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <ExportSuccessModal 
                    isOpen={showSuccess && !!readyBlob} 
                    onClose={() => {
                        setShowSuccess(false);
                        setReadyBlob(null);
                    }}
                    readyBlob={readyBlob}
                    readyUrl={readyUrl}
                    filename={readyFilename}
                    type="image"
                    title="QR CODE PRÊT !"
                    subtitle="Exportation terminée"
                />
            </div>
        </AnimatePresence>
    );
}
