import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Megaphone, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/auth';

export function AdminBanner() {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Announcement Banner State
    const [bannerEnabled, setBannerEnabled] = useState(false);
    const [bannerText, setBannerText] = useState('');
    const [bannerColor, setBannerColor] = useState('#ff0033');
    const [bannerBgColor, setBannerBgColor] = useState('#0a0a0a');
    const [bannerOpacity, setBannerOpacity] = useState(100);
    const [bannerSize, setBannerSize] = useState<'small' | 'medium' | 'large'>('medium');

    const storedPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    const canManageBanner = storedPermissions.includes('banner') || storedPermissions.includes('all');

    useEffect(() => {
        if (!canManageBanner) {
            navigate('/admin');
            return;
        }

        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.announcement_banner) {
                        setBannerEnabled(data.announcement_banner.enabled || false);
                        setBannerText(data.announcement_banner.text || '');
                        setBannerColor(data.announcement_banner.color || '#ff0033');
                        setBannerBgColor(data.announcement_banner.bgColor || '#0a0a0a');
                        setBannerOpacity(data.announcement_banner.opacity || 100);
                        setBannerSize(data.announcement_banner.size || 'medium');
                    }
                }
            } catch (e) {
                console.error('Failed to fetch banner settings', e);
            }
        };
        fetchSettings();
    }, [canManageBanner, navigate]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/settings');
            const data = res.ok ? await res.json() : {};

            const newSettings = {
                ...data,
                announcement_banner: {
                    enabled: bannerEnabled,
                    text: bannerText,
                    color: bannerColor,
                    bgColor: bannerBgColor,
                    opacity: bannerOpacity,
                    size: bannerSize
                }
            };

            const saveRes = await fetch('/api/settings/update', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (saveRes.ok) {
                setMessage('Configuration du bandeau enregistrée !');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Erreur lors de l\'enregistrement');
            }
        } catch (e) {
            setMessage('Erreur de connexion');
        } finally {
            setIsSaving(false);
        }
    };

    if (!canManageBanner) return null;

    return (
        <div className="min-h-screen bg-dark-bg py-8 md:py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">
                                Gestion <span className="text-neon-orange">Bandeau</span>
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm">Configurez le message défilant en haut du site.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3 bg-neon-orange hover:bg-neon-orange/80 text-white font-black uppercase rounded-xl transition-all shadow-lg shadow-neon-orange/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>

                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-neon-orange/10 rounded-2xl">
                                    <Megaphone className="w-6 h-6 text-neon-orange" />
                                </div>
                                <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight">Configuration</h2>
                            </div>
                            <button
                                onClick={() => setBannerEnabled(!bannerEnabled)}
                                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${bannerEnabled ? 'bg-neon-orange border-transparent text-white shadow-[0_0_20px_rgba(255,165,0,0.5)]' : 'bg-white/5 border-white/10 text-gray-500'}`}
                            >
                                {bannerEnabled ? 'Activé' : 'Désactivé'}
                            </button>
                        </div>

                        <div className={`space-y-8 transition-all duration-300 ${bannerEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">TEXTE DU MESSAGE</label>
                                <input
                                    type="text"
                                    value={bannerText}
                                    onChange={(e) => setBannerText(e.target.value.toUpperCase())}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold tracking-wide focus:outline-none focus:border-neon-orange transition-all placeholder:text-gray-700"
                                    placeholder="EX: BIENVENUE SUR DROPSIDERS..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">COULEUR TEXTE</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl border border-white/20 relative" style={{ backgroundColor: bannerColor }}>
                                                <input
                                                    type="color"
                                                    value={bannerColor}
                                                    onChange={(e) => setBannerColor(e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={bannerColor}
                                                onChange={(e) => setBannerColor(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm uppercase focus:outline-none focus:border-neon-orange transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">COULEUR FOND</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl border border-white/20 relative" style={{ backgroundColor: bannerBgColor }}>
                                                <input
                                                    type="color"
                                                    value={bannerBgColor}
                                                    onChange={(e) => setBannerBgColor(e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={bannerBgColor}
                                                onChange={(e) => setBannerBgColor(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm uppercase focus:outline-none focus:border-neon-orange transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                            <span>OPACITÉ FOND</span>
                                            <span className="text-neon-orange">{bannerOpacity}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={bannerOpacity}
                                            onChange={(e) => setBannerOpacity(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-orange"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">TAILLE DU BANDEAU</label>
                                        <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                                            {['small', 'medium', 'large'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setBannerSize(s as any)}
                                                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${bannerSize === s ? 'bg-neon-orange text-white' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    {s === 'small' ? 'Petit' : s === 'medium' ? 'Moyen' : 'Grand'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">APERÇU EN DIRECT</label>
                                <div
                                    className={`w-full border border-white/5 rounded-2xl relative overflow-hidden flex items-center ${bannerSize === 'small' ? 'h-8' : bannerSize === 'large' ? 'h-16' : 'h-12'}`}
                                    style={{
                                        backgroundColor: bannerBgColor,
                                        opacity: bannerOpacity / 100
                                    }}
                                >
                                    <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <p
                                        className="text-[10px] md:text-sm font-black uppercase tracking-widest whitespace-nowrap px-8"
                                        style={{ color: bannerColor }}
                                    >
                                        {bannerText || 'VOTRE TEXTE ICI...'} — {bannerText || 'VOTRE TEXTE ICI...'} — {bannerText || 'VOTRE TEXTE ICI...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 rounded-xl text-center font-bold uppercase tracking-widest text-xs ${message.includes('succès') || message.includes('enregistrée') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-neon-red/10 text-neon-red border border-neon-red/20'}`}
                        >
                            {message}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminBanner;
