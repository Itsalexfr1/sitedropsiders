import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Calendar, 
    MapPin, 
    Sparkles, 
    Share2, 
    Download, 
    Copy, 
    Check, 
    Trash2, 
    Plus, 
    Flame, 
    Music, 
    Globe, 
    Instagram,
    Smartphone,
    Eye
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { FlagIcon } from '../ui/FlagIcon';
import { resolveImageUrl } from '../../utils/image';
import { shareOrDownloadFile, triggerBlobDownload } from '../../utils/imageExport';

export interface MyFestivalSeasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: any[];
    favoriteIds: number[];
    onToggleFavorite: (id: number) => void;
}

const CITY_GEO: Record<string, { lat: number; lng: number; country: string }> = {
    // France
    'PARIS': { lat: 48.8566, lng: 2.3522, country: 'France' },
    'MARSEILLE': { lat: 43.2965, lng: 5.3698, country: 'France' },
    'LYON': { lat: 45.7640, lng: 4.8357, country: 'France' },
    'TOULOUSE': { lat: 43.6047, lng: 1.4442, country: 'France' },
    'NICE': { lat: 43.7102, lng: 7.2620, country: 'France' },
    'CANNES': { lat: 43.5528, lng: 7.0174, country: 'France' },
    'NANTES': { lat: 47.2184, lng: -1.5536, country: 'France' },
    'BORDEAUX': { lat: 44.8378, lng: -0.5792, country: 'France' },
    'LILLE': { lat: 50.6292, lng: 3.0573, country: 'France' },
    'STRASBOURG': { lat: 48.5734, lng: 7.7521, country: 'France' },
    'MONTPELLIER': { lat: 43.6108, lng: 3.8767, country: 'France' },
    'RENNES': { lat: 48.1173, lng: -1.6778, country: 'France' },
    'CLISSON': { lat: 47.0833, lng: -1.2833, country: 'France' },
    'LE BARCARÈS': { lat: 42.7877, lng: 3.0336, country: 'France' },
    'BARCARÈS': { lat: 42.7877, lng: 3.0336, country: 'France' },
    'MARMANDE': { lat: 44.5000, lng: 0.1667, country: 'France' },
    'BELFORT': { lat: 47.6397, lng: 6.8638, country: 'France' },
    'AIX-EN-PROVENCE': { lat: 43.5297, lng: 5.4474, country: 'France' },
    'GRENOBLE': { lat: 45.1885, lng: 5.7245, country: 'France' },
    // Belgique
    'BOOM': { lat: 51.0833, lng: 4.3667, country: 'Belgique' },
    'BRUXELLES': { lat: 50.8503, lng: 4.3517, country: 'Belgique' },
    'DOUR': { lat: 50.3958, lng: 3.7786, country: 'Belgique' },
    'ANVERS': { lat: 51.2194, lng: 4.4025, country: 'Belgique' },
    'LIÈGE': { lat: 50.6326, lng: 5.5797, country: 'Belgique' },
    'LIEGE': { lat: 50.6326, lng: 5.5797, country: 'Belgique' },
    'HASSELT': { lat: 50.9307, lng: 5.3325, country: 'Belgique' },
    // Pays-Bas
    'AMSTERDAM': { lat: 52.3676, lng: 4.9041, country: 'Pays-Bas' },
    'ARNHEM': { lat: 51.9851, lng: 5.8987, country: 'Pays-Bas' },
    'ROTTERDAM': { lat: 51.9244, lng: 4.4777, country: 'Pays-Bas' },
    'UTRECHT': { lat: 52.0907, lng: 5.1214, country: 'Pays-Bas' },
    'EINDHOVEN': { lat: 51.4416, lng: 5.4697, country: 'Pays-Bas' },
    'HAARLEM': { lat: 52.3874, lng: 4.6462, country: 'Pays-Bas' },
    'BREDA': { lat: 51.5719, lng: 4.7683, country: 'Pays-Bas' },
    // Allemagne
    'BERLIN': { lat: 52.5200, lng: 13.4050, country: 'Allemagne' },
    'FRANCFORT': { lat: 50.1109, lng: 8.6821, country: 'Allemagne' },
    'COLOGNE': { lat: 50.9375, lng: 6.9603, country: 'Allemagne' },
    'MUNICH': { lat: 48.1351, lng: 11.5820, country: 'Allemagne' },
    'NÜRBURGRING': { lat: 50.3356, lng: 6.9475, country: 'Allemagne' },
    'WEEZE': { lat: 51.6267, lng: 6.1956, country: 'Allemagne' },
    // Espagne
    'BARCELONE': { lat: 41.3851, lng: 2.1734, country: 'Espagne' },
    'MADRID': { lat: 40.4168, lng: -3.7038, country: 'Espagne' },
    'IBIZA': { lat: 38.9067, lng: 1.4206, country: 'Espagne' },
    'VALENCE': { lat: 39.4699, lng: -0.3763, country: 'Espagne' },
    // Suisse
    'GENEVE': { lat: 46.2044, lng: 6.1432, country: 'Suisse' },
    'GENÈVE': { lat: 46.2044, lng: 6.1432, country: 'Suisse' },
    'LAUSANNE': { lat: 46.5197, lng: 6.6323, country: 'Suisse' },
    'ZURICH': { lat: 47.3769, lng: 8.5417, country: 'Suisse' },
    // Croatie
    'PAG': { lat: 44.5500, lng: 14.8833, country: 'Croatie' },
    'SPLIT': { lat: 43.5081, lng: 16.4402, country: 'Croatie' },
    'ZAGREB': { lat: 45.8150, lng: 15.9819, country: 'Croatie' },
    // UK
    'LONDRES': { lat: 51.5074, lng: -0.1278, country: 'Royaume-Uni' },
};

function getCityCoords(loc: string, country?: string): { x: number; y: number; lat: number; lng: number } {
    const key = (loc || '').trim().toUpperCase();
    let geo = CITY_GEO[key];
    if (!geo) {
        // Fallback par pays
        const c = (country || '').toLowerCase();
        if (c.includes('franc')) geo = { lat: 46.6, lng: 2.2, country: 'France' };
        else if (c.includes('belg')) geo = { lat: 50.8, lng: 4.4, country: 'Belgique' };
        else if (c.includes('bas') || c.includes('netherland')) geo = { lat: 52.1, lng: 5.3, country: 'Pays-Bas' };
        else if (c.includes('allem') || c.includes('german')) geo = { lat: 51.1, lng: 10.4, country: 'Allemagne' };
        else if (c.includes('espag') || c.includes('spain')) geo = { lat: 40.4, lng: -3.7, country: 'Espagne' };
        else if (c.includes('suiss') || c.includes('switz')) geo = { lat: 46.8, lng: 8.2, country: 'Suisse' };
        else if (c.includes('croat')) geo = { lat: 44.5, lng: 15.5, country: 'Croatie' };
        else geo = { lat: 48.0, lng: 3.0, country: 'Europe' };
    }

    // Projection équirectangulaire calée sur Europe Ouest & Centrale
    // SVG viewBox: 0 0 800 650
    // Lng: -10 à +20 (largeur: 30)
    // Lat: 36 à 55 (hauteur: 19)
    const minLng = -10, maxLng = 20;
    const minLat = 36, maxLat = 55;
    const clampedLng = Math.max(minLng, Math.min(maxLng, geo.lng));
    const clampedLat = Math.max(minLat, Math.min(maxLat, geo.lat));
    
    const x = ((clampedLng - minLng) / (maxLng - minLng)) * 800;
    const y = ((maxLat - clampedLat) / (maxLat - minLat)) * 650;
    return { x, y, lat: geo.lat, lng: geo.lng };
}

export function MyFestivalSeasonModal({
    isOpen,
    onClose,
    events,
    favoriteIds,
    onToggleFavorite
}: MyFestivalSeasonModalProps) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'MAP' | 'STORY'>('MAP');
    const [userPseudo, setUserPseudo] = useState<string>(() => {
        return (user?.instagram ? `@${user.instagram.replace('@', '')}` : (user?.username ? `@${user.username}` : '@dropsiders_raver'));
    });
    const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [storyTheme, setStoryTheme] = useState<'NEON' | 'ACID' | 'CYBER'>('NEON');

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Filtrer les événements favoris et les ordonner par date
    const myEvents = useMemo(() => {
        const set = new Set(favoriteIds);
        return events
            .filter(e => set.has(e.id))
            .sort((a, b) => new Date(a.startDate || a.date).getTime() - new Date(b.startDate || b.date).getTime());
    }, [events, favoriteIds]);

    // Statistiques de la saison
    const stats = useMemo(() => {
        let totalDays = 0;
        const cities = new Set<string>();
        const countries = new Set<string>();

        myEvents.forEach(e => {
            if (e.location) cities.add(e.location.trim().toUpperCase());
            if (e.country) countries.add(e.country.trim().toUpperCase());

            const start = new Date(e.startDate || e.date).getTime();
            const end = new Date(e.endDate || e.startDate || e.date).getTime();
            if (!isNaN(start) && !isNaN(end) && end >= start) {
                const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
                totalDays += diffDays;
            } else {
                totalDays += 1;
            }
        });

        return {
            count: myEvents.length,
            days: totalDays,
            cities: cities.size,
            countries: countries.size || (cities.size > 0 ? 1 : 0)
        };
    }, [myEvents]);

    // Dessin du récap en story 9:16 (1080x1920) sur Canvas
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Fond sombre haute définition avec dégradé subtil
        const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
        if (storyTheme === 'ACID') {
            bgGrad.addColorStop(0, '#040d06');
            bgGrad.addColorStop(0.5, '#06170c');
            bgGrad.addColorStop(1, '#020503');
        } else if (storyTheme === 'CYBER') {
            bgGrad.addColorStop(0, '#040d1a');
            bgGrad.addColorStop(0.5, '#08172c');
            bgGrad.addColorStop(1, '#030710');
        } else {
            bgGrad.addColorStop(0, '#0d0414');
            bgGrad.addColorStop(0.5, '#160722');
            bgGrad.addColorStop(1, '#050208');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Effets néon d'ambiance
        const primaryNeon = storyTheme === 'ACID' ? '#00ff66' : (storyTheme === 'CYBER' ? '#00f0ff' : '#ff00ff');
        const secondaryNeon = storyTheme === 'ACID' ? '#ffff00' : (storyTheme === 'CYBER' ? '#9900ff' : '#00f0ff');

        // Halos lumineux
        const glowTop = ctx.createRadialGradient(200, 200, 20, 200, 200, 500);
        glowTop.addColorStop(0, primaryNeon + '33');
        glowTop.addColorStop(1, 'transparent');
        ctx.fillStyle = glowTop;
        ctx.fillRect(0, 0, 1080, 800);

        const glowBottom = ctx.createRadialGradient(880, 1700, 20, 880, 1700, 500);
        glowBottom.addColorStop(0, secondaryNeon + '28');
        glowBottom.addColorStop(1, 'transparent');
        ctx.fillStyle = glowBottom;
        ctx.fillRect(0, 1200, 1080, 720);

        // Grille cybernétique subtile en arrière-plan
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 60; x < 1080; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 1920);
            ctx.stroke();
        }
        for (let y = 60; y < 1920; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1080, y);
            ctx.stroke();
        }

        // 2. Header Dropsiders
        ctx.save();
        ctx.fillStyle = primaryNeon;
        ctx.font = '900 24px Montserrat, sans-serif';
        ctx.letterSpacing = '6px';
        ctx.fillText('DROPSIDERS.COM', 90, 130);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '800 18px Montserrat, sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('• AGENDA OFFICIEL 2026', 420, 130);
        ctx.restore();

        // Titre Principal
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 900 78px Montserrat, sans-serif';
        ctx.fillText('MA SAISON', 90, 230);
        
        ctx.fillStyle = primaryNeon;
        ctx.shadowColor = primaryNeon;
        ctx.shadowBlur = 30;
        ctx.fillText('FESTIVALS 2026', 90, 315);
        ctx.restore();

        // 3. User Badge & Passeport
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(90, 355, 900, 110, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 34px Montserrat, sans-serif';
        ctx.fillText(userPseudo || '@mon_agenda_rave', 130, 422);

        ctx.fillStyle = secondaryNeon;
        ctx.font = '800 18px Montserrat, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText('⚡ PASSEPORT FESTIVALIER VÉRIFIÉ', 560, 422);
        ctx.restore();

        // 4. Cartouches Statistiques (Festivals, Jours, Villes)
        const statsY = 500;
        const boxWidth = 280;
        const statsData = [
            { label: 'FESTIVALS', val: `${stats.count}`, color: primaryNeon },
            { label: 'JOURS DE SON', val: `${stats.days}`, color: secondaryNeon },
            { label: 'DESTINATIONS', val: `${stats.cities}`, color: '#ffffff' },
        ];

        statsData.forEach((st, idx) => {
            const bx = 90 + idx * 310;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.roundRect(bx, statsY, boxWidth, 120, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = st.color;
            ctx.font = 'italic 900 48px Montserrat, sans-serif';
            ctx.fillText(st.val, bx + 24, statsY + 65);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '800 16px Montserrat, sans-serif';
            ctx.letterSpacing = '2px';
            ctx.fillText(st.label, bx + 24, statsY + 98);
            ctx.restore();
        });

        // 5. Liste des Festivals (Jusqu'à 6 festivals affichés proprement)
        const listStartY = 660;
        const maxDisplay = 6;
        const displayEvents = myEvents.slice(0, maxDisplay);

        if (displayEvents.length === 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.roundRect(90, listStartY, 900, 500, 24);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic 800 32px Montserrat, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('AUCUN FESTIVAL COCHÉ POUR LE MOMENT', 540, listStartY + 230);
            
            ctx.fillStyle = primaryNeon;
            ctx.font = '700 20px Montserrat, sans-serif';
            ctx.fillText('Clique sur les cœurs ❤️ dans l\'Agenda pour ajouter tes festivals !', 540, listStartY + 280);
            ctx.restore();
        } else {
            const cardHeight = Math.min(145, Math.floor(950 / displayEvents.length));
            displayEvents.forEach((ev, i) => {
                const cy = listStartY + i * (cardHeight + 16);

                ctx.save();
                // Fond de carte
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeStyle = i === 0 ? primaryNeon + '88' : 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = i === 0 ? 2 : 1;
                ctx.beginPath();
                ctx.roundRect(90, cy, 900, cardHeight, 20);
                ctx.fill();
                ctx.stroke();

                // Numérotation
                ctx.fillStyle = primaryNeon;
                ctx.font = 'italic 900 22px Montserrat, sans-serif';
                ctx.fillText(`0${i + 1}`, 115, cy + 42);

                // Date
                const dateObj = new Date(ev.startDate || ev.date);
                const dateStr = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()
                    : '2026';
                ctx.fillStyle = secondaryNeon;
                ctx.font = '800 16px Montserrat, sans-serif';
                ctx.letterSpacing = '1px';
                ctx.fillText(dateStr, 175, cy + 42);

                // Nom du festival
                ctx.fillStyle = '#ffffff';
                ctx.font = 'italic 900 32px Montserrat, sans-serif';
                const truncatedTitle = ev.title.length > 28 ? ev.title.slice(0, 27) + '...' : ev.title;
                ctx.fillText(truncatedTitle.toUpperCase(), 115, cy + 85);

                // Ville & Genre
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = '700 18px Montserrat, sans-serif';
                const loc = (ev.location || 'FRANCE').toUpperCase();
                const gen = (ev.genre || ev.type || 'ELECTRONIC').toUpperCase();
                ctx.fillText(`📍 ${loc}  •  🎵 ${gen}`, 115, cy + 120);

                ctx.restore();
            });

            // Si plus de 6 festivals, mentionner le reste
            if (myEvents.length > maxDisplay) {
                const restCount = myEvents.length - maxDisplay;
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = 'italic 800 22px Montserrat, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`+ ${restCount} AUTRE${restCount > 1 ? 'S' : ''} FESTIVAL${restCount > 1 ? 'S' : ''} SUR MON AGENDA DROPSIDERS`, 540, 1700);
                ctx.restore();
            }
        }

        // 6. Footer & Branding
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(90, 1760);
        ctx.lineTo(990, 1760);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px Montserrat, sans-serif';
        ctx.fillText('DROPSIDERS', 90, 1820);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '700 18px Montserrat, sans-serif';
        ctx.fillText('Créé avec dropsiders.com/agenda • Partage ta saison', 90, 1855);

        // Badge Web Share
        ctx.fillStyle = primaryNeon;
        ctx.font = '800 20px Montserrat, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('#DROPSIDERS2026', 990, 1835);
        ctx.restore();

        try {
            setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (e) {
            console.error('Failed to generate preview URL', e);
        }
    }, [isOpen, myEvents, stats, userPseudo, storyTheme]);

    // Partage direct via Web Share API
    const handleShareStory = async () => {
        setIsSharing(true);
        try {
            const canvas = canvasRef.current || document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
            if (!blob) {
                throw new Error('Canvas toBlob failed');
            }
            await shareOrDownloadFile(
                blob,
                `mon-agenda-festivals-2026-${Date.now()}.png`,
                'Ma Saison Festival 2026 🎪',
                `Voici mon programme festivals 2026 sur Dropsiders ! (${stats.count} festivals, ${stats.days} jours de son)`
            );
        } catch (e) {
            console.error('Share error', e);
        } finally {
            setIsSharing(false);
        }
    };

    const handleDownloadStory = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(blob => {
            if (blob) {
                triggerBlobDownload(blob, `mon-agenda-festivals-2026.png`);
            }
        }, 'image/png');
    };

    const handleCopyText = () => {
        const lines = [
            `🎪 MA SAISON FESTIVALS 2026 (${stats.count} festivals, ${stats.days} jours de son) :`,
            ...myEvents.map((ev, i) => {
                const date = new Date(ev.startDate || ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                return `${i + 1}. ${ev.title} (${date} - ${ev.location})`;
            }),
            `\n👉 Planifie ta saison sur https://dropsiders.com/agenda`
        ];
        navigator.clipboard.writeText(lines.join('\n'));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-2xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(255,0,255,0.2)] flex flex-col max-h-[92vh]"
                >
                    {/* Header */}
                    <div className="p-5 sm:p-7 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-neon-fuchsia/10 via-neon-cyan/5 to-transparent">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-neon-fuchsia to-neon-cyan p-[2px] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                                <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                                    <Flame className="w-6 h-6 text-neon-fuchsia animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neon-fuchsia">
                                        Mon Agenda 2026
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[9px] font-black uppercase">
                                        {stats.count} Événement{stats.count > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-display font-black text-white italic tracking-tight uppercase">
                                    Ma Saison Festival 2026
                                </h2>
                            </div>
                        </div>

                        {/* Switcher d'onglets & Close */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl">
                                <button
                                    onClick={() => setActiveTab('MAP')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                        activeTab === 'MAP'
                                            ? 'bg-neon-fuchsia text-white shadow-[0_0_20px_rgba(255,0,255,0.4)]'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    <Globe className="w-4 h-4" />
                                    <span>Carte & Programme</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('STORY')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                        activeTab === 'STORY'
                                            ? 'bg-gradient-to-r from-neon-fuchsia to-neon-cyan text-white shadow-[0_0_20px_rgba(0,240,255,0.4)]'
                                            : 'text-white/60 hover:text-white'
                                    }`}
                                >
                                    <Instagram className="w-4 h-4" />
                                    <span>Story Récap 9:16</span>
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-3 border-b border-white/10 bg-black/40 divide-x divide-white/10 text-center py-3">
                        <div>
                            <span className="block text-2xl sm:text-3xl font-display font-black text-neon-fuchsia italic">
                                {stats.count}
                            </span>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/60">
                                🎪 Festivals Prévus
                            </span>
                        </div>
                        <div>
                            <span className="block text-2xl sm:text-3xl font-display font-black text-neon-cyan italic">
                                {stats.days}
                            </span>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/60">
                                ⚡ Jours de Son
                            </span>
                        </div>
                        <div>
                            <span className="block text-2xl sm:text-3xl font-display font-black text-white italic">
                                {stats.cities}
                            </span>
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/60">
                                🌍 Villes & Pays
                            </span>
                        </div>
                    </div>

                    {/* Contenu Défilable */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
                        {activeTab === 'MAP' ? (
                            <div className="space-y-6">
                                {/* Carte Interactive SVG France & Europe */}
                                <div className="relative bg-gradient-to-b from-[#0b0c16] to-[#04050a] border border-white/10 rounded-3xl p-4 overflow-hidden shadow-2xl">
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-neon-fuchsia animate-ping" />
                                            <span className="text-xs font-black uppercase tracking-widest text-white/80">
                                                Radar Festivals Europe & France
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-neon-cyan">
                                            {myEvents.length > 0 ? `${myEvents.length} spot(s) illuminé(s)` : 'Sélectionnez des festivals pour illuminer la carte'}
                                        </span>
                                    </div>

                                    {/* SVG Map Container */}
                                    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[380px] bg-radial from-neon-fuchsia/5 via-transparent to-transparent flex items-center justify-center overflow-hidden rounded-2xl border border-white/5">
                                        <svg
                                            viewBox="0 0 800 650"
                                            className="w-full h-full object-contain pointer-events-auto"
                                        >
                                            <defs>
                                                {/* Grille néon */}
                                                <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                </pattern>
                                                <filter id="neonGlowPin" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            <rect width="800" height="650" fill="url(#radarGrid)" />

                                            {/* Silhouette stylisée de l'Europe Occidentale / France */}
                                            {/* France hexagon outline */}
                                            <polygon
                                                points="310,210 395,190 440,240 450,330 400,430 310,430 250,340 260,250"
                                                fill="rgba(255, 0, 255, 0.03)"
                                                stroke="rgba(255, 0, 255, 0.2)"
                                                strokeWidth="1.5"
                                                strokeDasharray="4 4"
                                            />
                                            {/* Belgique & Pays-Bas */}
                                            <polygon
                                                points="370,120 420,110 435,170 380,180"
                                                fill="rgba(0, 240, 255, 0.03)"
                                                stroke="rgba(0, 240, 255, 0.2)"
                                                strokeWidth="1.5"
                                                strokeDasharray="4 4"
                                            />
                                            {/* Espagne */}
                                            <polygon
                                                points="170,430 310,430 300,560 170,550"
                                                fill="rgba(255, 255, 255, 0.02)"
                                                stroke="rgba(255, 255, 255, 0.1)"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                            />
                                            {/* Allemagne / Europe centrale */}
                                            <polygon
                                                points="435,140 560,150 540,320 440,280"
                                                fill="rgba(255, 255, 255, 0.02)"
                                                stroke="rgba(255, 255, 255, 0.1)"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                            />
                                            {/* Croatie / Adriatique */}
                                            <polygon
                                                points="560,330 650,340 680,450 590,430"
                                                fill="rgba(255, 255, 255, 0.02)"
                                                stroke="rgba(255, 255, 255, 0.1)"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                            />

                                            {/* Lignes de trajet entre les festivals de la saison */}
                                            {myEvents.length > 1 && myEvents.map((ev, i) => {
                                                if (i === 0) return null;
                                                const prev = myEvents[i - 1];
                                                const p1 = getCityCoords(prev.location, prev.country);
                                                const p2 = getCityCoords(ev.location, ev.country);
                                                return (
                                                    <g key={`path-${i}`}>
                                                        <line
                                                            x1={p1.x}
                                                            y1={p1.y}
                                                            x2={p2.x}
                                                            y2={p2.y}
                                                            stroke="url(#pathGrad)"
                                                            strokeWidth="2"
                                                            strokeDasharray="6 4"
                                                            className="opacity-70 animate-pulse"
                                                        />
                                                    </g>
                                                );
                                            })}

                                            <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ff00ff" />
                                                <stop offset="100%" stopColor="#00f0ff" />
                                            </linearGradient>

                                            {/* Pins des festivals favoris */}
                                            {myEvents.map((ev) => {
                                                const { x, y } = getCityCoords(ev.location, ev.country);
                                                const isHovered = hoveredEventId === ev.id;
                                                return (
                                                    <g 
                                                        key={`pin-${ev.id}`} 
                                                        className="cursor-pointer transition-transform duration-300"
                                                        onMouseEnter={() => setHoveredEventId(ev.id)}
                                                        onMouseLeave={() => setHoveredEventId(null)}
                                                        filter="url(#neonGlowPin)"
                                                    >
                                                        {/* Anneau pulsation */}
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r={isHovered ? 18 : 12}
                                                            fill="none"
                                                            stroke="#ff00ff"
                                                            strokeWidth="1.5"
                                                            className="animate-ping origin-center"
                                                            style={{ animationDuration: '2.5s' }}
                                                        />
                                                        {/* Point central */}
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r={isHovered ? 8 : 6}
                                                            fill="#ffffff"
                                                            stroke="#ff00ff"
                                                            strokeWidth="3"
                                                        />
                                                        {/* Label de la ville */}
                                                        <text
                                                            x={x}
                                                            y={y - 14}
                                                            textAnchor="middle"
                                                            fill="#ffffff"
                                                            fontSize={isHovered ? 13 : 10}
                                                            fontWeight="900"
                                                            fontFamily="Montserrat, sans-serif"
                                                            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                                        >
                                                            {ev.location}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                </div>

                                {/* Liste des festivals programmés */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-neon-fuchsia" />
                                            <span>Mon Programme Chronologique ({myEvents.length})</span>
                                        </h3>
                                        {myEvents.length > 0 && (
                                            <button
                                                onClick={handleCopyText}
                                                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                                            >
                                                {isCopied ? <Check className="w-3.5 h-3.5 text-neon-cyan" /> : <Copy className="w-3.5 h-3.5" />}
                                                <span>{isCopied ? 'Copié !' : 'Copier texte'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {myEvents.length === 0 ? (
                                        <div className="p-8 text-center bg-white/5 border border-white/10 rounded-3xl space-y-3">
                                            <Flame className="w-10 h-10 text-neon-fuchsia/40 mx-auto" />
                                            <h4 className="text-base font-black uppercase text-white">
                                                Aucun festival sélectionné
                                            </h4>
                                            <p className="text-sm text-gray-400 max-w-md mx-auto">
                                                Parcourez l'Agenda Dropsiders et cliquez sur l'icône ❤️ de vos festivals favoris pour construire votre saison 2026 et générer votre récap.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                            {myEvents.map((ev) => (
                                                <div
                                                    key={`fav-card-${ev.id}`}
                                                    onMouseEnter={() => setHoveredEventId(ev.id)}
                                                    onMouseLeave={() => setHoveredEventId(null)}
                                                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                                        hoveredEventId === ev.id
                                                            ? 'bg-neon-fuchsia/10 border-neon-fuchsia shadow-[0_0_20px_rgba(255,0,255,0.2)]'
                                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        {ev.image ? (
                                                            <img
                                                                src={resolveImageUrl(ev.image)}
                                                                alt={ev.title}
                                                                className="w-14 h-14 rounded-xl object-cover border border-white/10 flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-xl bg-neon-fuchsia/10 border border-neon-fuchsia/20 flex items-center justify-center flex-shrink-0">
                                                                <Music className="w-6 h-6 text-neon-fuchsia" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-neon-cyan block">
                                                                {new Date(ev.startDate || ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                                {ev.endDate && ev.endDate !== ev.startDate && ` - ${new Date(ev.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                                                            </span>
                                                            <h4 className="text-sm font-black text-white uppercase italic truncate">
                                                                {ev.title}
                                                            </h4>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase truncate">
                                                                <MapPin className="w-3 h-3 text-neon-fuchsia" />
                                                                <span>{ev.location}</span>
                                                                <FlagIcon location={ev.country || ev.location} className="w-3.5 h-2.5 ml-1" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => onToggleFavorite(ev.id)}
                                                        className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
                                                        title="Retirer de ma saison"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Onglet 2 : Story Récap 9:16 */
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* Aperçu Visuel 9:16 */}
                                    <div className="lg:col-span-5 flex flex-col items-center">
                                        <div className="relative w-full max-w-[310px] aspect-[9/16] rounded-[2.5rem] p-3 bg-black border-4 border-white/20 shadow-[0_0_50px_rgba(255,0,255,0.3)] overflow-hidden">
                                            {/* Dynamic Island / Notch */}
                                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 border border-white/10" />

                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt="Ma Saison Festivals Story"
                                                    className="w-full h-full object-cover rounded-[1.8rem]"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                    Génération de la Story...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Paramètres & Actions de partage */}
                                    <div className="lg:col-span-7 space-y-6">
                                        {/* Configuration */}
                                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
                                            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-neon-fuchsia" />
                                                <span>Personnalisation du Visuel</span>
                                            </h3>

                                            {/* Pseudo Instagram */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                                                    Votre Pseudo / Tag Instagram affiché
                                                </label>
                                                <div className="relative">
                                                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-fuchsia" />
                                                    <input
                                                        type="text"
                                                        value={userPseudo}
                                                        onChange={(e) => setUserPseudo(e.target.value)}
                                                        placeholder="@votre_pseudo"
                                                        className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-white focus:outline-none focus:border-neon-fuchsia transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Thème Couleur */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                                                    Ambiance Visuelle
                                                </label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { id: 'NEON', label: 'Neon Cyber', color: 'from-neon-fuchsia to-neon-cyan' },
                                                        { id: 'ACID', label: 'Acid Rave', color: 'from-[#00ff66] to-[#ffff00]' },
                                                        { id: 'CYBER', label: 'Deep Blue', color: 'from-neon-cyan to-indigo-600' }
                                                    ].map((th) => (
                                                        <button
                                                            key={th.id}
                                                            type="button"
                                                            onClick={() => setStoryTheme(th.id as any)}
                                                            className={`p-3 rounded-2xl border text-center transition-all ${
                                                                storyTheme === th.id
                                                                    ? 'bg-white/10 border-white text-white shadow-lg'
                                                                    : 'bg-black/40 border-white/10 text-white/50 hover:text-white'
                                                            }`}
                                                        >
                                                            <div className={`w-full h-2 rounded-full bg-gradient-to-r ${th.color} mb-2`} />
                                                            <span className="text-[10px] font-black uppercase block">{th.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions d'Export Web Share & Download */}
                                        <div className="space-y-3">
                                            {/* Bouton Partage Natif Story (Web Share API) */}
                                            <button
                                                type="button"
                                                onClick={handleShareStory}
                                                disabled={isSharing || myEvents.length === 0}
                                                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-neon-fuchsia via-[#ee2a7b] to-neon-cyan text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,0,255,0.4)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
                                            >
                                                <Smartphone className="w-5 h-5" />
                                                <span>
                                                    {isSharing
                                                        ? 'Ouverture du partage...'
                                                        : '📱 Partager en Story (Instagram / TikTok)'}
                                                </span>
                                            </button>

                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Bouton Téléchargement Image HD */}
                                                <button
                                                    type="button"
                                                    onClick={handleDownloadStory}
                                                    disabled={myEvents.length === 0}
                                                    className="py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    <Download className="w-4 h-4 text-neon-cyan" />
                                                    <span>Télécharger PNG</span>
                                                </button>

                                                {/* Bouton Copier le récap texte */}
                                                <button
                                                    type="button"
                                                    onClick={handleCopyText}
                                                    disabled={myEvents.length === 0}
                                                    className="py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    {isCopied ? <Check className="w-4 h-4 text-neon-fuchsia" /> : <Copy className="w-4 h-4 text-neon-fuchsia" />}
                                                    <span>{isCopied ? 'Texte copié !' : 'Copier le texte'}</span>
                                                </button>
                                            </div>

                                            <p className="text-[11px] text-gray-400 text-center font-medium">
                                                💡 Sur smartphone, cliquer sur <strong>Partager en Story</strong> ouvre directement l'application Instagram avec le visuel prêt à être posté !
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Canvas caché pour le rendu */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
