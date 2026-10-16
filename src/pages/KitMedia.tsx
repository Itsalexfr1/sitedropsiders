import React, { useState, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Lock, Instagram, ArrowRight, Users, ExternalLink,
    Facebook, Zap, Mic, FileText, Download,
    Calendar, Radio, Tv, Play, Headphones, Sparkles, MapPin, Ticket, Flame, Volume2,
    Trophy, Gamepad2, Gift, HelpCircle, CheckCircle2, TrendingUp, Copy, Check, Award, Eye, Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SpotifyWidget } from '../components/widgets/SpotifyWidget';
import { FlagIcon } from '../components/ui/FlagIcon';
import settings from '../data/settings.json';
import { XIcon } from '../components/ui/XIcon';

interface StatItem {
    label: string;
    value: string;
    detail: string;
    icon: React.ReactNode;
    color: string;
    link?: string;
}

interface ServiceItem {
    title: string;
    desc: string;
    icon: React.ReactNode;
}

const KitMedia = () => {
    const { language, setLanguage } = useLanguage();
    const [password, setPassword] = useState(localStorage.getItem('kit_media_password_saved') || '');
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('kit_media_auth') === 'true');
    const [socials, setSocials] = useState<any>((settings as any).socials || {});
    const [error, setError] = useState('');
    const [copiedSvg, setCopiedSvg] = useState(false);

    // Fetch latest settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.socials) setSocials(data.socials);
                }
            } catch (e: any) {
                console.error("Failed to fetch settings in KitMedia", e);
            }
        };
        fetchSettings();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            const correctPass = data.kit_media_password || data.email_password || '';
            if (data.socials) setSocials(data.socials);

            if (password.toUpperCase() === correctPass.toUpperCase()) {
                setIsAuthenticated(true);
                setError('');
                localStorage.setItem('kit_media_auth', 'true');
                localStorage.setItem('kit_media_password_saved', password);
            } else {
                setError(language === 'fr' ? "Code d'accès incorrect" : "Incorrect access code");
                shakeForm();
            }
        } catch (e: any) {
            // fallback to admin if API fails
            if (password.toUpperCase() === '2026') {
                setIsAuthenticated(true);
                setError('');
                localStorage.setItem('kit_media_auth', 'true');
                localStorage.setItem('kit_media_password_saved', password);
            } else {
                setError(language === 'fr' ? "Code d'accès incorrect" : "Incorrect access code");
                shakeForm();
            }
        }
    };

    const shakeForm = () => {
        const form = document.getElementById('login-form');
        if (form) {
            form.classList.add('animate-shake');
            setTimeout(() => form.classList.remove('animate-shake'), 500);
        }
    };

    const handleDownloadPdf = () => {
        window.print();
    };

    // Custom Scroll Animations
    const { scrollYProgress } = useScroll();
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const scaleImage = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

    const coveredEvents = useMemo(() => language === 'fr' ? [
        "Tomorrowland Winter (depuis 2019)",
        "Tomorrowland Belgium",
        "EDC Las Vegas",
        "Burning Man 2026/2025",
        "Ultra Miami & Europe",
        "Elrow (Ibiza, Barcelona, Las Vegas)",
        "Untold Festival",
        "Parookaville",
        "Sea You Festival",
        "Et de nombreux autres festivals"
    ] : [
        "Tomorrowland Winter (since 2019)",
        "Tomorrowland Belgium",
        "EDC Las Vegas",
        "Burning Man 2026/2025",
        "Ultra Miami & Europe",
        "Elrow (Ibiza, Barcelona, Las Vegas)",
        "Untold Festival",
        "Parookaville",
        "Sea You Festival",
        "And many other festivals"
    ], [language]);

    const stats: StatItem[] = useMemo(() => [
        { label: "Facebook", value: "50 000", detail: language === 'fr' ? "Abonnés" : "Followers", icon: <Facebook className="w-5 h-5" />, color: "text-blue-500", link: `https://www.facebook.com/${(socials.facebook || 'dropsidersfr').replace('@', '')}` },
        { label: "TikTok", value: "7 000", detail: language === 'fr' ? "Abonnés" : "Followers", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1 .05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" /></svg>, color: "text-cyan-400", link: `https://www.tiktok.com/@${(socials.tiktok || 'dropsiders.fr').replace('@', '')}` },
        { label: "Instagram", value: "4 700", detail: language === 'fr' ? "Abonnés" : "Followers", icon: <Instagram className="w-5 h-5" />, color: "text-pink-500", link: `https://www.instagram.com/${(socials.instagram || 'dropsiders.fr').replace('@', '')}` },
        { label: language === 'fr' ? "Total Réseaux" : "Total Social", value: "61 700", detail: language === 'fr' ? "Abonnés Cumulés" : "Combined Followers", icon: <Users className="w-5 h-5" />, color: "text-yellow-400" }
    ], [language, socials]);

    const services: ServiceItem[] = useMemo(() => [
        { title: language === 'fr' ? "Community Hub" : "Community Hub", desc: language === 'fr' ? "Engagement maximal avec Blind Tests, Quiz interactifs et un système de soumission de questions par les utilisateurs." : "Maximum engagement with Blind Tests, interactive Quizzes, and a user question submission system.", icon: <Users className="w-6 h-6" /> },
        { title: language === 'fr' ? "Utility Tools" : "Utility Tools", desc: language === 'fr' ? "Plateforme collaborative incluant Covoiturage, Guide du festivalier et Alertes Line-up en temps réel." : "Collaborative platform including Carpooling, Festival Guide, and Real-time Line-up Alerts.", icon: <ExternalLink className="w-6 h-6" /> },
        { title: language === 'fr' ? "Live Takeover" : "Live Takeover", desc: language === 'fr' ? "Système de direct immersif avec BPM temps-réel, sondages interactifs et clips communautaires." : "Immersive live system with real-time BPM, interactive polls, and community clips.", icon: <Mic className="w-6 h-6" /> }
    ], [language]);

    const featuredArtists = [
        { name: "Morten", image: "https://www.dropsiders.fr/uploads/uploads/746b4ef81d385342-250506_Morten_AURA56901_copy.webp", role: "EDC Las Vegas", link: "https://dropsiders.fr/interviews" },
        { name: "Da Tweekaz", image: "https://cdn-images.dzcdn.net/images/artist/872392e50ad6dd5602c4bb34f14c2c9f/1000x1000-000000-80-0-0.jpg", role: "EDC Las Vegas", link: "https://dropsiders.fr/interviews" },
        { name: "Henri PFR", image: "https://www.dropsiders.fr/uploads/1825045676e37db1-test__2_.webp", role: "Tomorrowland Winter", link: "https://dropsiders.fr/interviews" },
        { name: "Third Party", image: "https://www.dropsiders.fr/uploads/c2d433079ae2ad53-maxresdefault.jpg", role: "Tomorrowland Winter", link: "https://dropsiders.fr/interviews" }
    ];

    const socialLinks = [
        { name: "Instagram", url: `https://www.instagram.com/${(socials.instagram || 'dropsiders.fr').replace('@', '')}/`, icon: <Instagram className="w-5 h-5" /> },
        { name: "TikTok", url: `https://www.tiktok.com/@${(socials.tiktok || 'dropsiders.fr').replace('@', '')}`, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1 .05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" /></svg> },
        { name: "YouTube", url: `https://www.youtube.com/@${(socials.youtube || 'dropsiders').replace('@', '')}`, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
        { name: "X", url: `https://x.com/${(socials.x || socials.twitter || 'dropsidersfr').replace('@', '')}`, icon: <XIcon className="w-5 h-5" /> },
        { name: "Facebook", url: `https://www.facebook.com/${(socials.facebook || 'dropsidersfr').replace('@', '')}/`, icon: <Facebook className="w-5 h-5" /> }
    ];

    const galleryImages = [
        "/assets/galeries/top-100-djs-mag-unvrs-ibiza-2025-espagne/img-1.jpg",
        "/assets/galeries/john-summit-ushuaia-ibiza-2025-espagne/img-2.jpg",
        "/assets/galeries/burning-man-2025-usa/img-3.jpg",
        "/assets/galeries/tomorrowland-2025-belgique/img-1.jpg",
        "/assets/galeries/ultra-europe-2025-croatie/img-2.jpg",
        "/assets/galeries/dj-snake-arenes-de-nimes-2025-france/img-1.jpg",
        "/assets/galeries/the-end-of-genesys-2025-sphere-las-vegas-usa/img-10.jpg",
        "/assets/galeries/edc-las-vegas-2025-usa/img-1.jpg"
    ];

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-black to-red-600/20 animate-pulse-slow"></div>
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-radial from-neon-red/10 to-transparent opacity-30 animate-pulse-slow"></div>

                <div className="absolute top-8 right-8 z-50 flex gap-2">
                    <button
                        onClick={() => setLanguage('fr')}
                        aria-label="Switch to French"
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'fr' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        <FlagIcon location="France" className="w-4 h-3" />
                        <span>FR</span>
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        aria-label="Switch to English"
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        <FlagIcon location="USA" className="w-4 h-3" />
                        <span>EN</span>
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
                >
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl flex items-center justify-center border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-display font-black text-center text-white mb-1 tracking-tighter uppercase">KIT MEDIA</h1>
                    <p className="text-[10px] font-black tracking-[0.4em] text-neon-red text-center mb-6 uppercase">dropsiders</p>
                    <p className="text-gray-400 text-center text-sm mb-10 uppercase tracking-widest leading-relaxed opacity-70">
                        {language === 'fr'
                            ? "Accès réservé aux partenaires Dropsiders. Veuillez entrer votre code."
                            : "Access reserved for Dropsiders partners. Please enter your code."
                        }
                    </p>

                    <form id="login-form" onSubmit={handleLogin} className="space-y-6">
                        <div className="relative group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={language === 'fr' ? "MOT DE PASSE" : "PASSWORD"}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-700 focus:outline-none focus:border-neon-red focus:bg-white/10 transition-all text-center tracking-[0.3em] font-bold"
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-neon-red text-[10px] text-center font-black uppercase tracking-widest"
                            >{error}</motion.p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-white text-black font-black uppercase py-5 rounded-2xl hover:bg-neon-red hover:text-white transition-all duration-300 tracking-[0.2em] text-xs flex items-center justify-center gap-3 group shadow-xl shadow-white/5"
                        >
                            {language === 'fr' ? "ACCÉDER" : "ACCESS"}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center leading-relaxed">
                            {language === 'fr'
                                ? "Dropsiders est le média de référence pour l'actualité des festivals électro. Cet espace Kit Media regroupe nos données d'audience, nos offres de partenariats et nos ressources pour la presse."
                                : "Dropsiders is the leading media for electro festival news. This Kit Media space contains our audience data, partnership offers, and press resources."
                            }
                        </p>
                    </div>
                </motion.div>

                <div className="mt-6 text-center relative z-10">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-white text-[10px] uppercase tracking-[0.3em] font-bold transition-all group"
                    >
                        <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        {language === 'fr' ? 'Retour au site' : 'Back to site'}
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative font-sans">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[#050505]"></div>
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 0] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-red/10 blur-[120px] rounded-full"
                ></motion.div>
                <motion.div
                    animate={{ scale: [1, 1.5, 1], x: [0, 100, 0] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"
                ></motion.div>
                <div className="absolute inset-0 bg-gradient-to-br from-black via-[#050505] to-black"></div>
            </div>


            <div className="relative z-10">
                <header className="h-screen flex flex-col justify-center items-center text-center px-4 relative overflow-hidden">
                    <motion.div style={{ y: heroY }} className="space-y-6 relative z-10 w-full">
                        <div className="flex flex-col items-center gap-6 mb-8 mt-12">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', duration: 1.5 }}
                                className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
                            >
                                <span className="text-xs font-black tracking-[0.4em] text-neon-red uppercase">{language === 'fr' ? 'nous sommes dropsiders' : 'we are dropsiders'}</span>
                            </motion.div>

                            <div className="flex gap-2 bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-full pointer-events-auto">
                                <button

                                    onClick={() => setLanguage('fr')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${language === 'fr' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <FlagIcon location="France" className="w-4 h-3" />
                                    <span>FR</span>
                                </button>
                                <button

                                    onClick={() => setLanguage('en')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${language === 'en' ? 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,51,51,0.4)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <FlagIcon location="USA" className="w-4 h-3" />
                                    <span>EN</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative overflow-hidden w-full flex flex-col items-center">
                            <motion.h1
                                initial={{ y: 200, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
                                className="text-[12vw] font-display font-black tracking-tighter leading-[0.8] uppercase flex justify-center w-full whitespace-nowrap"
                            >
                                <span className="text-white relative inline-block overflow-hidden"><motion.span className="inline-block" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ delay: 0.1, duration: 1 }}>M E D I A</motion.span></span>
                            </motion.h1>
                            <motion.h1
                                initial={{ y: 200, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.1 }}
                                className="text-[12vw] font-display font-black tracking-tighter leading-[0.8] uppercase flex justify-center w-full whitespace-nowrap ml-12"
                            >
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-black relative inline-block overflow-hidden"><motion.span className="inline-block" initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ delay: 0.2, duration: 1 }}>K I T .</motion.span></span>
                            </motion.h1>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1 }}
                            className="text-gray-300 text-sm md:text-xl uppercase tracking-[0.5em] mt-16 font-light max-w-2xl mx-auto pt-8 italic relative"
                        >
                            {language === 'fr'
                                ? "\"L'immersion au cœur de la scène électronique mondiale.\""
                                : "\"Immersion at the heart of the global electronic scene.\""
                            }
                        </motion.p>
                    </motion.div>
                </header>

                <section className="py-24 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full border-b border-white/5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {stats.map((stat, idx) => {
                            const Content = (
                                <motion.div
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: idx * 0.15, type: 'spring', stiffness: 100 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    whileHover={{ scale: 1.05, y: -10 }}
                                    className={`bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-center group hover:bg-white/10 transition-all border-b-2 hover:border-b-neon-red h-full ${stat.link ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 ${stat.color} group-hover:scale-110 transition-transform`}
                                    >
                                        {stat.icon}
                                    </motion.div>
                                    <div className="text-4xl md:text-6xl font-black mb-2 tabular-nums drop-shadow-lg">{stat.value}</div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">{stat.label} {stat.detail}</div>
                                </motion.div>
                            );

                            return stat.link ? (
                                <a key={idx} href={stat.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                                    {Content}
                                </a>
                            ) : (
                                <div key={idx} className="h-full">
                                    {Content}
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-12 mb-8">
                            <h2 className="text-3xl font-display font-black mb-12 uppercase tracking-tight flex items-center gap-4">
                                <span className="w-8 h-px bg-neon-red"></span>
                                {language === 'fr' ? "NOS INTERVIEWS" : "OUR INTERVIEWS"}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {featuredArtists.map((artist, i) => (
                                    <a
                                        href={artist.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        key={i}


                                    >
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                            viewport={{ once: true, margin: '-100px' }}
                                            whileHover={{ y: -20, rotate: i % 2 === 0 ? 2 : -2 }}
                                            className="relative group rounded-[2.5rem] overflow-hidden aspect-[4/5] border border-white/10 bg-white/5"
                                        >
                                            <motion.img
                                                src={artist.image}
                                                alt={artist.name}
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=2070&auto=format&fit=crop';
                                                }}
                                                className="w-full h-full object-cover transition-all duration-700"
                                                whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    whileHover={{ opacity: 1, x: 0 }}
                                                    className="w-8 h-8 rounded-full bg-neon-red text-white flex items-center justify-center mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </motion.div>
                                                <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em] mb-2">{artist.role}</p>
                                                <h3 className="text-3xl font-display font-black uppercase tracking-tighter drop-shadow-2xl">{artist.name}</h3>
                                            </div>
                                        </motion.div>
                                    </a>
                                ))}
                            </div>

                            {/* Spotify Playlists Section */}
                            <div className="col-span-12 mt-16">
                                <h2 className="text-3xl font-display font-black mb-12 uppercase tracking-tight flex items-center gap-4">
                                    <span className="w-8 h-px bg-neon-red"></span>
                                    {language === 'fr' ? "NOS PLAYLISTS" : "OUR PLAYLISTS"}
                                </h2>
                                <div className="mt-8">
                                    <SpotifyWidget showTitle={false} height={352} itemWidth="250px" />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7 space-y-12">
                            <div>
                                <h2 className="text-3xl font-display font-black mb-6 uppercase tracking-tight flex items-center gap-4">
                                    <span className="w-8 h-px bg-neon-red"></span>
                                    {language === 'fr' ? "À PROPOS" : "ABOUT US"}
                                </h2>
                                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-light">
                                    <strong className="text-white font-black italic">Dropsiders</strong> {language === 'fr'
                                        ? "est le média francophone de référence dédié à la culture électronique. Nous capturons l'énergie pure des festivals pour une audience ultra-engagée."
                                        : "is the leading French-speaking media dedicated to electronic culture. We capture the pure energy of festivals for a highly engaged audience."}
                                </p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-md">
                                <h3 className="text-xl font-display font-bold mb-8 uppercase tracking-widest text-neon-red">
                                    {language === 'fr' ? "ÉVÉNEMENTS COUVERTS" : "COVERED EVENTS"}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {coveredEvents.map((event, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-400 group">
                                            <div className="w-1.5 h-1.5 bg-neon-red rounded-full group-hover:scale-150 transition-transform"></div>
                                            <span className="text-sm font-medium group-hover:text-white transition-colors">{event}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative">
                            <div className="sticky top-32 space-y-4">
                                <motion.div
                                    whileHover={{ scale: 1.02, rotate: -1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="aspect-[4/5] bg-white/5 rounded-[3rem] overflow-hidden border border-white/10 relative group"
                                >
                                    <motion.img
                                        style={{ scale: scaleImage }}
                                        src="/assets/galeries/top-100-djs-mag-unvrs-ibiza-2025-espagne/img-1.jpg"
                                        alt="Coverage"
                                        className="w-full h-full object-cover transition-all duration-1000 group-hover:filter-none"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-500"></div>
                                    <div className="absolute bottom-8 left-8 transition-transform duration-500 group-hover:-translate-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-neon-red animate-pulse shadow-[0_0_10px_red]"></div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Exclusive Coverage</p>
                                        </div>
                                        <p className="text-3xl font-display font-black uppercase tracking-tighter drop-shadow-xl">Ibiza 2025</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-32 bg-neon-red/[0.03] border-y border-neon-red/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neon-red/[0.02] to-transparent pointer-events-none"></div>
                    <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                            <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter text-neon-red">
                                GALLERY<span className="text-neon-red italic font-serif">.</span>
                            </h2>
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-black mb-2">
                                {language === 'fr' ? "Capturer l'instant" : "Capturing the moment"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {galleryImages.map((img, i) => (
                                <motion.a
                                    key={i}
                                    href={`/galerie/${img.split('/')[3]}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, duration: 0.6 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    whileHover={{ scale: 1.05, y: -10, zIndex: 10, rotate: i % 2 === 0 ? 1 : -1 }}


                                    className={`gallery-card-container rounded-3xl overflow-hidden border border-neon-red/10 aspect-square block ${i === 1 ? 'md:row-span-2 md:aspect-auto' : ''}`}
                                >
                                    <motion.img
                                        src={img}
                                        alt="Gallery item"
                                        className="w-full h-full object-cover"
                                        whileHover={{ scale: 1.15 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                    <div className="gallery-red-overlay">
                                        <h4 className="gallery-event-name">
                                            {img.split('/')[3].split('-').filter(w => !['france', 'usa', 'espagne', 'belgique', 'croatie'].includes(w)).map(w => w.toUpperCase()).join(' ')}
                                        </h4>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AGENDA SECTION */}
                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full border-t border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-96 h-96 bg-neon-fuchsia/10 blur-[150px] rounded-full pointer-events-none" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-fuchsia/10 border border-neon-fuchsia/20 text-neon-fuchsia text-[10px] font-black uppercase tracking-[0.3em]">
                                <Calendar className="w-3.5 h-3.5" />
                                {language === 'fr' ? 'Agenda & Événements' : 'Agenda & Events'}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter leading-tight">
                                {language === 'fr' ? "Le Guide Référence des Festivals & Clubs" : "The Benchmark Guide for Festivals & Clubs"}
                            </h2>
                            <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light">
                                {language === 'fr'
                                    ? "L'annuaire des festivals électro et clubs emblématiques en Europe et dans le monde : fiches complètes avec line-up détaillé, billetterie officielle, localisation et notations de la communauté."
                                    : "The benchmark directory for electro festivals and iconic clubs across Europe and worldwide: full line-up details, official ticketing links, locations, and community reviews."
                                }
                            </p>
                            <div className="pt-2 flex flex-wrap gap-4">
                                <a
                                    href="/agenda"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neon-fuchsia hover:text-white transition-all shadow-xl"
                                >
                                    {language === 'fr' ? 'Explorer l\'Agenda' : 'Explore the Agenda'}
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: <MapPin className="w-5 h-5 text-neon-fuchsia" />,
                                    title: language === 'fr' ? "Festivals & Clubs Référencés" : "Listed Festivals & Clubs",
                                    desc: language === 'fr' ? "Une cartographie complète des festivals majeurs (Tomorrowland, EDC, Ultra, Defqon.1) et clubs emblématiques." : "Full mapping of major festivals and iconic clubs worldwide."
                                },
                                {
                                    icon: <Ticket className="w-5 h-5 text-neon-fuchsia" />,
                                    title: language === 'fr' ? "Billetterie & Accès Direct" : "Ticketing & Direct Access",
                                    desc: language === 'fr' ? "Redirection directe vers les billetteries officielles avec suivi des phases de vente et sold-out." : "Direct links to official ticketing platforms with sale phase tracking."
                                },
                                {
                                    icon: <Flame className="w-5 h-5 text-neon-fuchsia" />,
                                    title: language === 'fr' ? "Mise en Avant Partenaire" : "Partner Spotlight",
                                    desc: language === 'fr' ? "Visibilité prioritaire en tête de liste, badge 'Événement Recommandé' et push auprès de notre communauté." : "Top-of-list priority placement, 'Recommended Event' badge, and targeted pushes."
                                },
                                {
                                    icon: <Users className="w-5 h-5 text-neon-fuchsia" />,
                                    title: language === 'fr' ? "Audience Ultra-Qualifiée" : "High-Intent Audience",
                                    desc: language === 'fr' ? "Un public captif prêt à réserver ses pass, logements et transports pour leurs prochains festivals." : "A captive audience ready to book passes, accommodation, and travel."
                                }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-neon-fuchsia/40 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                                        {card.icon}
                                    </div>
                                    <h4 className="font-display font-black uppercase text-sm text-white mb-2">{card.title}</h4>
                                    <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* RADIO SECTION */}
                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full bg-white/[0.02] border-t border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 right-0 w-96 h-96 bg-neon-cyan/10 blur-[150px] rounded-full pointer-events-none" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 order-2 lg:order-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: <Radio className="w-5 h-5 text-neon-cyan" />,
                                    title: language === 'fr' ? "Diffusion Non-Stop 24/7" : "24/7 Non-Stop Broadcast",
                                    desc: language === 'fr' ? "Flux audio haute fidélité disponible en continu sur web et mobile sans interruption." : "High-fidelity audio stream available non-stop across web and mobile."
                                },
                                {
                                    icon: <Headphones className="w-5 h-5 text-neon-cyan" />,
                                    title: language === 'fr' ? "Programmation Par Créneaux" : "Scheduled Time Blocks",
                                    desc: language === 'fr' ? "Morning Energy, Relive Classics, Prime Electro, Deep Sessions et Zone Rouge pour chaque moment de la journée." : "Morning Energy, Relive Classics, Prime Electro, Deep Sessions, and Zone Rouge."
                                },
                                {
                                    icon: <Zap className="w-5 h-5 text-neon-cyan" />,
                                    title: language === 'fr' ? "Flash Actus & Nouveautés" : "Festival News & Flash Updates",
                                    desc: language === 'fr' ? "Annonces de line-ups majeurs, dates clés et sorties de tracks intégrées aux tranches musicales." : "Major line-up announcements, key festival dates, and track releases integrated into music slots."
                                },
                                {
                                    icon: <Sparkles className="w-5 h-5 text-neon-cyan" />,
                                    title: language === 'fr' ? "Lecteur Persistant Global" : "Global Persistent Player",
                                    desc: language === 'fr' ? "Le player radio reste actif durant toute la navigation des visiteurs sur le site Dropsiders." : "The radio player stays active as visitors browse all pages of Dropsiders."
                                }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-neon-cyan/40 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                                        {card.icon}
                                    </div>
                                    <h4 className="font-display font-black uppercase text-sm text-white mb-2">{card.title}</h4>
                                    <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-[0.3em]">
                                <Radio className="w-3.5 h-3.5" />
                                {language === 'fr' ? 'Web-Radio 24/7' : '24/7 Web-Radio'}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter leading-tight">
                                {language === 'fr' ? "Dropsiders Radio : Le Son Des Festivals" : "Dropsiders Radio: The Festival Sound"}
                            </h2>
                            <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light">
                                {language === 'fr'
                                    ? "Une web-radio dédiée 24h/24 aux meilleurs titres, livesets exclusifs et émissions thématiques. Une opportunité d'impact sonore unique pour faire résonner votre marque ou festival auprès de passionnés."
                                    : "A 24/7 web-radio dedicated to the finest anthems, exclusive live sets, and themed shows. A unique audio branding opportunity to amplify your event to electro lovers."
                                }
                            </p>
                            <div className="pt-2 flex flex-wrap gap-4">
                                <a
                                    href="/radio"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neon-cyan hover:text-black transition-all shadow-xl"
                                >
                                    {language === 'fr' ? 'Écouter la Radio' : 'Listen to the Radio'}
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TV SECTION */}
                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full border-t border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-96 h-96 bg-neon-red/10 blur-[150px] rounded-full pointer-events-none" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-red/10 border border-neon-red/20 text-neon-red text-[10px] font-black uppercase tracking-[0.3em]">
                                <Tv className="w-3.5 h-3.5" />
                                {language === 'fr' ? 'Chaîne Vidéo Continue' : 'Continuous Video Channel'}
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter leading-tight">
                                {language === 'fr' ? "Dropsiders TV : L'Immersion Vidéo 4K" : "Dropsiders TV: 4K Video Immersion"}
                            </h2>
                            <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light">
                                {language === 'fr'
                                    ? "La première chaîne vidéo francophone continue dédiée aux musiques électroniques. Retransmission des sets légendaires, aftermovies immersifs, clips officiels et reportages exclusifs rythmés par des tranches thématiques."
                                    : "The premier continuous video channel dedicated to electronic music. Legendary festival sets, immersive aftermovies, official music videos, and backstage reports structured across themed daily slots."
                                }
                            </p>
                            <div className="pt-2 flex flex-wrap gap-4">
                                <a
                                    href="/tv"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neon-red hover:text-white transition-all shadow-xl"
                                >
                                    {language === 'fr' ? 'Regarder Dropsiders TV' : 'Watch Dropsiders TV'}
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: <Play className="w-5 h-5 text-neon-red" />,
                                    title: language === 'fr' ? "Grille Vidéo Continue" : "Continuous Video Grid",
                                    desc: language === 'fr' ? "Morning Clips, Relive Festivals, Day Time, Prime Time Dropsiders et Zone Rouge pour une expérience télévisuelle totale." : "Themed slots from morning chill clips to peak-time festival livesets."
                                },
                                {
                                    icon: <Tv className="w-5 h-5 text-neon-red" />,
                                    title: language === 'fr' ? "Retransmissions Live & Sets 4K" : "Live Broadcasts & 4K Sets",
                                    desc: language === 'fr' ? "Les performances captées sur les scènes de Tomorrowland, EDC Las Vegas, Ultra, Burning Man ou l'Amnesia Ibiza." : "Captured performances from Tomorrowland, EDC, Ultra, Burning Man, or Amnesia Ibiza."
                                },
                                {
                                    icon: <Sparkles className="w-5 h-5 text-neon-red" />,
                                    title: language === 'fr' ? "Intégration PreMiD & Discord" : "PreMiD & Discord Integration",
                                    desc: language === 'fr' ? "Rich Presence affichant en temps réel sur Discord le programme et l'artiste en cours de diffusion." : "Real-time Discord Rich Presence displaying current show, artist, and track."
                                },
                                {
                                    icon: <Zap className="w-5 h-5 text-neon-red" />,
                                    title: language === 'fr' ? "Sponsoring Écran & Trailers" : "Screen Sponsoring & Trailers",
                                    desc: language === 'fr' ? "Diffusion de teasers de festivals, bandeaux publicitaires dynamiques et sponsoring de tranches horaires." : "Festival trailers broadcast, dynamic banners, and exclusive time-slot sponsorships."
                                }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md hover:border-neon-red/40 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                                        {card.icon}
                                    </div>
                                    <h4 className="font-display font-black uppercase text-sm text-white mb-2">{card.title}</h4>
                                    <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── ESPACE COMMUNAUTÉ & GAMIFICATION (SYSTÈME DE "DROPS") ── */}
                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full bg-white/[0.015] border-t border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/3 left-0 w-96 h-96 bg-neon-purple/10 blur-[150px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-10 right-0 w-96 h-96 bg-neon-yellow/10 blur-[150px] rounded-full pointer-events-none" />

                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            {language === 'fr' ? 'Espace Communauté & Gamification' : 'Community Hub & Gamification'}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter mb-4">
                            {language === 'fr' ? "Le Système de \"Drops\" & Récompenses" : "The \"Drops\" System & Fan Rewards"}
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                            {language === 'fr'
                                ? "Une plateforme d'engagement ultra-fidèle où la passion des musiques électroniques se transforme en jeu, collection et récompenses concrètes pour les festivaliers."
                                : "A highly engaged platform where electronic music passion turns into gameplay, collectibles, and concrete rewards for festival-goers."
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {[
                            {
                                icon: <Layers className="w-6 h-6 text-neon-cyan" />,
                                badge: language === 'fr' ? "Cartes Collector" : "Collectible Cards",
                                badgeColor: "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20",
                                title: language === 'fr' ? "Cartes à Collectionner" : "Digital Collectible Cards",
                                desc: language === 'fr'
                                    ? "Système de cartes virtuelles avec raretés (Common, Rare, Epic, Legendary). Les festivaliers ouvrent des packs 'Drops', complètent leurs albums et s'échangent des cartes d'artistes et scènes."
                                    : "Digital card system featuring multiple rarity tiers (Common, Rare, Epic, Legendary). Fans open 'Drops' packs, complete albums, and trade artist and festival stage cards."
                            },
                            {
                                icon: <Trophy className="w-6 h-6 text-neon-yellow" />,
                                badge: language === 'fr' ? "Fidélité & Statuts" : "Loyalty & Status",
                                badgeColor: "text-neon-yellow bg-neon-yellow/10 border-neon-yellow/20",
                                title: language === 'fr' ? "Festivaliers Fidèles" : "Loyal Festival-Goers",
                                desc: language === 'fr'
                                    ? "Programme de récompenses récompensant la régularité des festivaliers sur le site : points d'XP, badges de collectionneurs, accès anticipé aux news et classements communautaires."
                                    : "Reward framework acknowledging festival-goers' active participation: XP points, collector badges, early content access, and community leaderboards."
                            },
                            {
                                icon: <HelpCircle className="w-6 h-6 text-neon-fuchsia" />,
                                badge: language === 'fr' ? "Forte Interaction" : "High Engagement",
                                badgeColor: "text-neon-fuchsia bg-neon-fuchsia/10 border-neon-fuchsia/20",
                                title: language === 'fr' ? "Quiz & Blind Tests" : "Interactive Quizzes & Blind Tests",
                                desc: language === 'fr'
                                    ? "Modules interactifs de blind tests musicaux et de quiz spécialisés sur l'histoire des festivals électro, générant des taux de participation et de rétention exceptionnels."
                                    : "Addictive interactive blind tests and festival trivia quizzes driving industry-leading engagement and prolonged user session times."
                            },
                            {
                                icon: <Gift className="w-6 h-6 text-neon-red" />,
                                badge: language === 'fr' ? "Activation Partenaire" : "Brand Activation",
                                badgeColor: "text-neon-red bg-neon-red/10 border-neon-red/20",
                                title: language === 'fr' ? "Récompenses Partenaires" : "Exclusive Partner Perks",
                                desc: language === 'fr'
                                    ? "Possibilité directe pour un festival ou une marque d'offrir des récompenses exclusives : pass VIP festivals, codes de réduction billetterie, merchandising officiel ou accès backstage."
                                    : "Direct turnkey opportunity for festivals and brands to distribute real rewards: VIP festival passes, ticketing discount codes, official merch, and backstage perks."
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group backdrop-blur-md"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                            {item.icon}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${item.badgeColor}`}>
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-display font-black mb-3 uppercase tracking-tight text-white group-hover:text-neon-red transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                                <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        {language === 'fr' ? 'Gamification 360°' : '360° Gamification'}
                                    </span>
                                    <div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_8px_rgba(255,18,65,0.6)]" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Encadré Partenaire Merch / Pass VIP */}
                    <div className="bg-gradient-to-r from-neon-purple/20 via-black to-neon-red/20 border border-white/15 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-2xl max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-3 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neon-yellow">
                                <Award className="w-3.5 h-3.5" />
                                {language === 'fr' ? 'Offre Partenaires Exclusifs' : 'Exclusive Partner Program'}
                            </div>
                            <h4 className="text-2xl md:text-3xl font-display font-black uppercase text-white tracking-tight">
                                {language === 'fr' ? "Offrez vos Pass VIP & Merch à notre communauté" : "Offer your VIP Passes & Merch to our community"}
                            </h4>
                            <p className="text-gray-300 text-xs md:text-sm max-w-xl leading-relaxed">
                                {language === 'fr'
                                    ? "Associez votre marque ou festival aux quêtes communautaires de Dropsiders. Bénéficiez d'une visibilité organique maximale auprès de passionnés ultra-actifs prêts à voyager."
                                    : "Tie your brand or event into Dropsiders community quests. Enjoy high-intent exposure directly reaching active festival-goers ready to travel."
                                }
                            </p>
                        </div>
                        <a
                            href="mailto:contact@dropsiders.fr?subject=Partenariat%20Gamification%20%26%20Dotations"
                            className="shrink-0 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neon-red hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95"
                        >
                            {language === 'fr' ? "Proposer une dotation" : "Sponsor a reward"}
                        </a>
                    </div>
                </section>

                {/* ── ÉTUDES DE CAS & SUCCESS STORIES ── */}
                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full border-t border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-neon-cyan/10 blur-[150px] rounded-full pointer-events-none" />

                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {language === 'fr' ? 'Festivals Couverts & Présence Terrain' : 'Covered Festivals & Media Presence'}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter mb-4">
                            {language === 'fr' ? "Nos Couvertures Officielles" : "Our Official Festival Coverage"}
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                            {language === 'fr'
                                ? "Exemples de festivals majeurs où Dropsiders assure une présence terrain avec accréditation presse, interviews d'artistes et reportages complets."
                                : "Examples of major festivals where Dropsiders provides on-site media coverage with press accreditations, artist interviews, and full reporting."
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                festival: "Tomorrowland Winter",
                                location: "Alpe d'Huez, France",
                                image: "/assets/galeries/tomorrowland-2025-belgique/img-1.jpg",
                                tag: language === 'fr' ? "Accréditation Média Officielle" : "Official Media Accreditation",
                                link: "/galerie/tomorrowland-2025-belgique",
                                deliverables: language === 'fr'
                                    ? ["Couverture live quotidienne 7 jours en altitude", "Interviews exclusives d'artistes (Henri PFR, Third Party)", "Récaps vidéo des scènes et ambiance festivaliers", "Galeries photos HD de jour et de nuit"]
                                    : ["7-day on-site live coverage in the mountains", "Exclusive artist interviews (Henri PFR, Third Party)", "Stage video recaps and festival vibe", "Day and night HD photo galleries"]
                            },
                            {
                                festival: "EDC Las Vegas",
                                location: "Motor Speedway, USA",
                                image: "/assets/galeries/edc-las-vegas-2025-usa/img-1.jpg",
                                tag: language === 'fr' ? "Immersion Under the Electric Sky" : "Immersion Under the Electric Sky",
                                link: "/galerie/edc-las-vegas-2025-usa",
                                deliverables: language === 'fr'
                                    ? ["Immersion 3 nuits sur le plus grand festival des USA", "Interviews exclusives (Morten, Da Tweekaz, Paul Oakenfold)", "Reportages scénographies, feux d'artifice & scènes", "Stories en direct & formats courts immersifs"]
                                    : ["3-night immersion on the largest US electronic festival", "Exclusive interviews (Morten, Da Tweekaz, Paul Oakenfold)", "Stage design, pyrotechnics & show reporting", "Live stories & short-form immersive videos"]
                            },
                            {
                                festival: "Ultra Music Festival",
                                location: "Ultra Miami & Europe Split",
                                image: "/assets/galeries/ultra-europe-2025-croatie/img-2.jpg",
                                tag: language === 'fr' ? "Couverture Internationale" : "International Media Coverage",
                                link: "/galerie/ultra-europe-2025-croatie",
                                deliverables: language === 'fr'
                                    ? ["Présence terrain scènes Mainstage & Resistance", "Analyse des nouveautés scéniques et sets marquants", "Articles récaps complets sur le site Dropsiders", "Relais temps réel auprès de la communauté"]
                                    : ["On-site Mainstage & Resistance stage presence", "Breakdown of stage innovations & standout sets", "In-depth editorial recap articles on Dropsiders", "Real-time updates shared with the community"]
                            },
                            {
                                festival: "Burning Man",
                                location: "Black Rock Desert, Nevada",
                                image: "/assets/galeries/burning-man-2025-usa/img-3.jpg",
                                tag: language === 'fr' ? "Immersion Artistique" : "Artistic Immersion",
                                link: "/galerie/burning-man-2025-usa",
                                deliverables: language === 'fr'
                                    ? ["Reportage photo immersif au cœur de la Playa", "Mise en lumière des Mutant Vehicles & Sound Camps", "Storytelling visuel authentique et artistique", "Portraits et témoignages de la communauté"]
                                    : ["Immersive photo journalism in the Playa", "Mutant Vehicles & Sound Camps spotlight", "Authentic artistic visual storytelling", "Community portraits and testimonials"]
                            }
                        ].map((study, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -8 }}
                                className="rounded-[2.5rem] bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md flex flex-col justify-between group hover:border-neon-red/40 transition-all shadow-2xl"
                            >
                                <div className="relative aspect-[16/9] overflow-hidden">
                                    <img
                                        src={study.image}
                                        alt={study.festival}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                    <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-red mb-1">{study.location}</p>
                                            <h3 className="text-2xl font-display font-black uppercase text-white tracking-tight">{study.festival}</h3>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 backdrop-blur-md">
                                            {study.tag}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col justify-between">
                                    {/* Livrables concrets */}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-red mb-4">
                                            {language === 'fr' ? 'Couverture & Livrables Réalisés :' : 'Coverage & Real Deliverables:'}
                                        </p>
                                        <ul className="space-y-3 mb-6">
                                            {study.deliverables.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-xs text-gray-300 leading-relaxed">
                                                    <CheckCircle2 className="w-4 h-4 text-neon-red shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <a
                                            href={study.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white hover:text-neon-red transition-colors"
                                        >
                                            {language === 'fr' ? "Voir la galerie photo" : "View Photo Gallery"}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            DROPSIDERS
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── BRAND ASSETS & MATÉRIEL PRESSE TÉLÉCHARGEABLE ── */}
                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full bg-white/[0.015] border-t border-white/5 relative overflow-hidden">
                    <div className="absolute top-1/2 right-0 w-96 h-96 bg-neon-red/10 blur-[150px] rounded-full pointer-events-none" />

                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-red/10 border border-neon-red/20 text-neon-red text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                            <Download className="w-3.5 h-3.5" />
                            {language === 'fr' ? 'Brand Assets & Matériel Presse' : 'Brand Assets & Press Kit'}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter mb-4">
                            {language === 'fr' ? "Logos Vectoriels & Charte Graphique" : "Vector Logos & Official Brand Kit"}
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                            {language === 'fr'
                                ? "Téléchargez nos logos officiels pour intégrer Dropsiders en tant que partenaire média sur vos affiches, flyers, trailers vidéo, écrans LED et supports de communication."
                                : "Download official vector assets to include Dropsiders as media partner on your festival line-up posters, flyers, video teasers, and LED screens."
                            }
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* Aperçu Logo Blanc sur fond sombre */}
                        <div className="bg-[#050505] border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-white/30 transition-all shadow-xl">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        {language === 'fr' ? 'Version Blanche (Fond Sombre)' : 'White Version (Dark BG)'}
                                    </span>
                                    <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                                        PNG HD + SVG
                                    </span>
                                </div>
                                <div className="h-28 flex items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/5 mb-8">
                                    <img src="/logo.png" alt="Dropsiders Logo Blanc" className="max-h-12 w-auto object-contain" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <a
                                    href="/logo.png"
                                    download="Dropsiders_Logo_White.png"
                                    className="w-full py-3.5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neon-red hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    {language === 'fr' ? 'Télécharger Logo Blanc (PNG HD)' : 'Download White Logo (HD PNG)'}
                                </a>
                            </div>
                        </div>

                        {/* Aperçu Logo Noir sur fond clair */}
                        <div className="bg-[#f5f5f7] border border-black/10 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-black/30 transition-all shadow-xl text-black">
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                                        {language === 'fr' ? 'Version Noire (Fond Clair)' : 'Black Version (Light BG)'}
                                    </span>
                                    <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-black/10 text-black border border-black/10">
                                        PNG HD + SVG
                                    </span>
                                </div>
                                <div className="h-28 flex items-center justify-center p-4 bg-white rounded-2xl border border-black/5 mb-8">
                                    <img src="/logo_black.png" alt="Dropsiders Logo Noir" className="max-h-12 w-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <a
                                    href="/logo_black.png"
                                    download="Dropsiders_Logo_Black.png"
                                    className="w-full py-3.5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neon-red transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    {language === 'fr' ? 'Télécharger Logo Noir (PNG HD)' : 'Download Black Logo (HD PNG)'}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Spécifications & Actions complémentaires */}
                    <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center md:text-left">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-wider text-neon-red mb-1">
                                    {language === 'fr' ? 'Couleur Principale' : 'Primary Color'}
                                </p>
                                <p className="font-mono text-sm text-white font-bold">#FF1241 (Néon Rouge)</p>
                                <p className="text-[10px] text-gray-500 mt-1">RGB(255, 18, 65)</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-wider text-neon-cyan mb-1">
                                    {language === 'fr' ? 'Zone de Sécurité' : 'Safe Area'}
                                </p>
                                <p className="text-sm text-white font-bold">15% de marge minimale</p>
                                <p className="text-[10px] text-gray-500 mt-1">Sans obstruction visuelle</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-wider text-neon-yellow mb-1">
                                    {language === 'fr' ? 'Usage Officiel' : 'Usage Guide'}
                                </p>
                                <p className="text-sm text-white font-bold">Affiches, Print & LED</p>
                                <p className="text-[10px] text-gray-500 mt-1">Haute définition 300 DPI</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={() => {
                                    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 90" fill="none"><text x="10" y="65" fill="#ffffff" font-family="'Outfit', sans-serif" font-weight="900" font-size="52" letter-spacing="3">DROPSIDERS</text><circle cx="370" cy="40" r="10" fill="#FF1241" /></svg>`;
                                    navigator.clipboard.writeText(svgString);
                                    setCopiedSvg(true);
                                    setTimeout(() => setCopiedSvg(false), 2500);
                                }}
                                className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                {copiedSvg ? (
                                    <>
                                        <Check className="w-4 h-4 text-neon-green" />
                                        <span className="text-neon-green">{language === 'fr' ? 'Code SVG Copié !' : 'SVG Code Copied!'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-gray-400" />
                                        {language === 'fr' ? 'Copier le code SVG Vectoriel' : 'Copy Vector SVG Code'}
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadPdf}
                                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-neon-red to-neon-purple text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-neon-red/30 flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <FileText className="w-4 h-4" />
                                {language === 'fr' ? 'Télécharger la Charte & Kit PDF' : 'Download Full Press Kit (PDF)'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* MEDIA SOLUTIONS SECTION (NO FIXED PRICES) */}
                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full border-t border-white/5">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <p className="text-neon-red text-[10px] font-black tracking-[0.5em] uppercase mb-4">
                            {language === 'fr' ? 'Solutions & Formats' : 'Solutions & Formats'}
                        </p>
                        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter mb-4">
                            {language === 'fr' ? "NOS SOLUTIONS MÉDIAS" : "OUR MEDIA SOLUTIONS"}
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {language === 'fr'
                                ? "Chaque festival, marque ou artiste a des besoins uniques. Nous construisons des activations sur-mesure combinant présence terrain, amplification digitale et diffusion broadcast."
                                : "Every festival, brand, or artist has unique needs. We craft bespoke activations combining on-site presence, digital amplification, and broadcast distribution."
                            }
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        {[
                            {
                                name: language === 'fr' ? "Couverture Terrain" : "On-Site Coverage",
                                subtitle: language === 'fr' ? "Immersion Festival" : "Festival Immersion",
                                items: language === 'fr'
                                    ? ["Équipe envoyée sur place", "Captation photo & vidéo", "Interviews d'artistes", "Stories live en direct", "Article récapitulatif complet"]
                                    : ["On-site media team", "Photo & video capture", "Artist interviews", "Real-time live stories", "Full recap article"]
                            },
                            {
                                name: language === 'fr' ? "Activation Digitale" : "Digital Activation",
                                subtitle: language === 'fr' ? "Réseaux & Viralité" : "Social & Reach",
                                items: language === 'fr'
                                    ? ["Posts & Reels Instagram / TikTok", "Mise en avant Newsletter", "Article sponsorisé dédié", "Relais Facebook & X", "Campagnes jeux concours"]
                                    : ["Instagram / TikTok Posts & Reels", "Newsletter campaign", "Dedicated sponsored article", "Facebook & X distribution", "Contest campaigns"]
                            },
                            {
                                name: language === 'fr' ? "Broadcast & Médias" : "Broadcast & Media",
                                subtitle: language === 'fr' ? "TV & Web-Radio" : "TV & Web-Radio",
                                items: language === 'fr'
                                    ? ["Bandeaux promotionnels sur Dropsiders TV", "Diffusion de trailers officiels", "Sponsoring d'émissions & Mentions radio", "Habillage du lecteur global", "Mention en direct à l'antenne"]
                                    : ["Promo banners on Dropsiders TV", "Official trailer broadcast", "Show sponsoring & Radio mentions", "Global audio player branding", "On-air shoutouts"]
                            },
                            {
                                name: language === 'fr' ? "Agenda & Billetterie" : "Agenda & Ticketing",
                                subtitle: language === 'fr' ? "Conversion & Ventes" : "Sales & Conversion",
                                items: language === 'fr'
                                    ? ["Mise en avant 'Tête d'Affiche' Agenda", "Lien direct vers la billetterie", "Badge Partenaire Officiel", "Alertes Line-up auprès des abonnés", "Relais dates clés de vente"]
                                    : ["Top-of-list Agenda spotlight", "Direct ticketing referral link", "Official Partner badge", "Line-up alerts to subscribers", "Key sale dates coverage"]
                            }
                        ].map((pkg, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-neon-red/50 transition-all flex flex-col justify-between group"
                            >
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-red mb-2">{pkg.subtitle}</p>
                                    <h3 className="text-xl font-display font-black mb-6 uppercase tracking-tight text-white group-hover:text-neon-red transition-colors">{pkg.name}</h3>
                                    <ul className="space-y-3 mb-8">
                                        {pkg.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-gray-400 leading-relaxed">
                                                <div className="w-1.5 h-1.5 bg-neon-red rounded-full mt-1.5 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <a
                                        href="mailto:contact@dropsiders.fr"
                                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white group-hover:text-neon-red transition-colors"
                                    >
                                        {language === 'fr' ? "Demander une proposition" : "Request a proposal"}
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-neon-red/10 via-white/5 to-neon-cyan/10 border border-white/10 rounded-[2.5rem] p-10 text-center max-w-4xl mx-auto backdrop-blur-md">
                        <h4 className="text-xl font-display font-black uppercase text-white tracking-tight mb-2">
                            {language === 'fr' ? "Un Projet Particulier ou une Campagne Globale ?" : "A Specific Project or Global Campaign?"}
                        </h4>
                        <p className="text-gray-300 text-xs md:text-sm max-w-2xl mx-auto mb-6 leading-relaxed">
                            {language === 'fr'
                                ? "Toutes nos formules sont conçues sur-mesure selon vos objectifs, vos dates et vos cibles. Nous vous accompagnons de la stratégie éditoriale à la diffusion finale."
                                : "All our activations are bespoke to fit your goals, dates, and audience. We assist you from editorial strategy to final distribution."
                            }
                        </p>
                        <a
                            href="mailto:contact@dropsiders.fr"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neon-red hover:text-white transition-all shadow-xl"
                        >
                            {language === 'fr' ? "Échanger avec notre équipe" : "Talk with our team"}
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </section>

                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full border-t border-white/5">
                    <div className="text-center mb-16">
                        <p className="text-neon-red text-[10px] font-black tracking-[0.5em] uppercase mb-4">Let's build something</p>
                        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter">
                            {language === 'fr' ? "OPPORTUNITÉS DE COLLABORATION" : "COLLABORATION OPPORTUNITIES"}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Pour les festivals & organisateurs */}
                        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-white/5">
                                <Users className="w-24 h-24" />
                            </div>
                            <h3 className="text-2xl font-display font-black uppercase mb-6 tracking-wide">
                                {language === 'fr' ? "Pour les festivals & organisateurs" : "For festivals & organizers"}
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { fr: "Accréditations presse", en: "Press accreditations" },
                                    { fr: "Couverture live", en: "Live coverage" },
                                    { fr: "Interviews d'artistes", en: "Artist interviews" },
                                    { fr: "Récap vidéos & photos", en: "Video & photo recaps" }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-gray-400 group-hover:text-gray-200 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-red shadow-[0_0_8px_rgba(255,51,51,0.5)]"></div>
                                        <span className="font-bold uppercase tracking-widest text-xs">{language === 'fr' ? item.fr : item.en}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Pour les marques & partenaires */}
                        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 text-white/5">
                                <Zap className="w-24 h-24" />
                            </div>
                            <h3 className="text-2xl font-display font-black uppercase mb-6 tracking-wide">
                                {language === 'fr' ? "Pour les marques & partenaires" : "For brands & partners"}
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { fr: "Intégrations de contenu", en: "Content integration" },
                                    { fr: "Posts sponsorisés", en: "Sponsored posts" },
                                    { fr: "Campagnes sociales", en: "Social campaigns" },
                                    { fr: "Contenu vidéo dédié", en: "Dedicated video content" }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-gray-400 group-hover:text-gray-200 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-red shadow-[0_0_8px_rgba(255,51,51,0.5)]"></div>
                                        <span className="font-bold uppercase tracking-widest text-xs">{language === 'fr' ? item.fr : item.en}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>


                <section className="py-48 text-center px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/10 to-transparent"></div>
                    <div className="relative z-10 max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-display font-black uppercase mb-12 tracking-tighter">
                            {language === 'fr' ? "PRET A NOUS FAIRE CONFIANCE" : "READY TO TRUST US?"}
                        </h2>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="inline-block relative p-[1px] rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 group"
                            >
                                <a href="mailto:contact@dropsiders.fr" className="block px-12 md:px-16 py-6 bg-[#050505] rounded-full hover:bg-white transition-all group overflow-hidden relative">
                                    <span className="relative z-10 text-white group-hover:text-black font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3">
                                        {language === 'fr' ? "Collaborer avec nous" : "Partner with us"}
                                        <ExternalLink className="w-4 h-4" />
                                    </span>
                                </a>
                            </motion.div>

                            <div className="flex gap-4">
                                {socialLinks.map((social, i) => (
                                    <motion.a
                                        key={i}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ y: -5, scale: 1.1 }}
                                        className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all font-black"
                                        title={social.name}
                                    >
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="py-12 border-t border-white/5 text-center px-6">
                    <div className="flex justify-center gap-8 mb-6">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">© 2026 DROPSIDERS MEDIA GROUP</p>
                        <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em]">CONFIDENTIAL DOCUMENT</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default KitMedia;
