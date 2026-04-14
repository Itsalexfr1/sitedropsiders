import React, { useState, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Lock, Instagram, ArrowRight, Users, ExternalLink,
    Facebook, Zap, Mic
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SpotifyWidget } from '../components/widgets/SpotifyWidget';
import { FlagIcon } from '../components/ui/FlagIcon';
import settings from '../data/settings.json';

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
            if (password.toUpperCase() === '2024') {
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

    // Custom Scroll Animations
    const { scrollYProgress } = useScroll();
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const scaleImage = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

    const coveredEvents = useMemo(() => language === 'fr' ? [
        "Tomorrowland Winter (depuis 2019)",
        "Tomorrowland Belgium",
        "EDC Las Vegas",
        "Burning Man 2024/2025",
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
        "Burning Man 2024/2025",
        "Ultra Miami & Europe",
        "Elrow (Ibiza, Barcelona, Las Vegas)",
        "Untold Festival",
        "Parookaville",
        "Sea You Festival",
        "And many other festivals"
    ], [language]);

    const stats: StatItem[] = useMemo(() => [
        { label: "Facebook", value: "48K", detail: "Followers", icon: <Facebook className="w-5 h-5" />, color: "text-blue-500", link: `https://www.facebook.com/${(socials.facebook || 'dropsidersfr').replace('@', '')}` },
        { label: "Instagram", value: "6.9K", detail: "Followers", icon: <Instagram className="w-5 h-5" />, color: "text-pink-500", link: `https://www.instagram.com/${(socials.instagram || 'dropsiders.fr').replace('@', '')}` },
        { label: "TikTok", value: "4.6K", detail: "Followers", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1 .05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" /></svg>, color: "text-cyan-400", link: `https://www.tiktok.com/@${(socials.tiktok || 'dropsiders.fr').replace('@', '')}` },
        { label: "Total Reach", value: "100K", detail: language === 'fr' ? "Impression / Mois" : "Impression / Month", icon: <Zap className="w-5 h-5" />, color: "text-yellow-400" }
    ], [language, socials]);

    const services: ServiceItem[] = useMemo(() => [
        { title: language === 'fr' ? "Community Hub" : "Community Hub", desc: language === 'fr' ? "Engagement maximal avec Blind Tests, Quiz interactifs et un système de soumission de questions par les utilisateurs." : "Maximum engagement with Blind Tests, interactive Quizzes, and a user question submission system.", icon: <Users className="w-6 h-6" /> },
        { title: language === 'fr' ? "Utility Tools" : "Utility Tools", desc: language === 'fr' ? "Plateforme collaborative incluant Covoiturage, Guide du festivalier et Alertes Line-up en temps réel." : "Collaborative platform including Carpooling, Festival Guide, and Real-time Line-up Alerts.", icon: <ExternalLink className="w-6 h-6" /> },
        { title: language === 'fr' ? "Live Takeover" : "Live Takeover", desc: language === 'fr' ? "Système de direct immersif avec BPM temps-réel, sondages interactifs et clips communautaires." : "Immersive live system with real-time BPM, interactive polls, and community clips.", icon: <Mic className="w-6 h-6" /> }
    ], [language]);

    const featuredArtists = [
        { name: "Morten", image: "https://159001-3fab-4329-0001.production.d.bitsof.love/eyJidWNrZXQiOiJwdWJsaWMtYXNzZXRzLXN0YWNrLXB1YmxpY2Fzc2V0c2NjMDcxYjgzLWRwNW1tb3NwYWl3diIsImtleSI6ImltYWdlcy9Nb3J0ZW4tdGVhY2hlcl8yMDI0LTA1LTA4LTE2MTgzNF96aGJyLnBuZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTkyMH0sInRvRm9ybWF0Ijoid2VicCIsIndlYnAiOnsicXVhbGl0eSI6NzV9fX0=?w=1920&q=75", role: "Special Guest", link: "https://dropsiders.fr/interviews/interview-morten-edc-las-vegas-2025-37" },
        { name: "Da Tweekaz", image: "https://yt3.googleusercontent.com/5IxI2tqwGqGcpA1xctAIuSBuS5xHqf_fXBKb6zmSmRKQZKefUzSIkFF7YzesAd5yq80tacmoiQ=s900-c-k-c0x00ffffff-no-rj", role: "Exclusive Interview", link: "https://dropsiders.fr/interviews/interview-da-tweekaz-edc-las-vegas-2025-34" },
        { name: "Vintage Culture", image: "https://dropsiders.fr/uploads/migrated/c_limit,w_1200,h_630/f_jpg/q_auto/production/artworks/artists/vintageculturemusic.jpg", role: "Artist Spotlight", link: "https://dropsiders.fr/interviews/interview-video-vintage-culture-tomorrowland-winter-145" }
    ];

    const socialLinks = [
        { name: "Instagram", url: `https://www.instagram.com/${(socials.instagram || 'dropsiders.fr').replace('@', '')}/`, icon: <Instagram className="w-5 h-5" /> },
        { name: "TikTok", url: `https://www.tiktok.com/@${(socials.tiktok || 'dropsiders.fr').replace('@', '')}`, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1 .05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" /></svg> },
        { name: "YouTube", url: `https://www.youtube.com/@${(socials.youtube || 'dropsiders').replace('@', '')}`, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
        { name: "X", url: `https://x.com/${(socials.twitter || socials.x || 'dropsidersfr').replace('@', '')}`, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-8 min-h-[500px]">
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

                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full bg-white/[0.02]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-neon-red text-[10px] font-black tracking-[0.5em] uppercase mb-4">{language === 'fr' ? 'Écosystème Numérique' : 'Digital Ecosystem'}</p>
                            <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter mb-8 leading-tight">
                                {language === 'fr' ? "UNE PLATEFORME UNIQUE POUR LES FANS D'ELECTRO" : "A UNIQUE PLATFORM FOR ELECTRO FANS"}
                            </h2>
                            <div className="space-y-6">
                                {[
                                    { title: language === 'fr' ? "Avis & Notes" : "Reviews & Ratings", desc: language === 'fr' ? "Les utilisateurs notent l'organisation, le son et la nourriture des festivals." : "Users rate festival organization, sound, and food." },
                                    { title: language === 'fr' ? "Covoiturage" : "Carpooling", desc: language === 'fr' ? "Un outil direct pour organiser ses trajets vers les plus grands événements." : "A direct tool to organize trips to the biggest events." },
                                    { title: language === 'fr' ? "Alertes Line-up" : "Line-up Alerts", desc: language === 'fr' ? "Notification instantanée dès qu'une tête d'affiche est annoncée." : "Instant notification as soon as a headliner is announced." },

                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="w-1.5 h-1.5 bg-neon-red rounded-full mt-2 group-hover:scale-150 transition-transform"></div>
                                        <div>
                                            <h4 className="font-bold uppercase tracking-widest text-xs text-white mb-1">{feature.title}</h4>
                                            <p className="text-gray-500 text-xs leading-relaxed group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-neon-red/10 blur-[100px] rounded-full"></div>
                            <div className="relative bg-black/40 border border-white/10 rounded-[3rem] p-8 backdrop-blur-3xl overflow-hidden group">
                                <div className="aspect-video bg-gradient-to-br from-neon-red/20 to-blue-900/20 rounded-2xl flex items-center justify-center p-8 overflow-hidden">
                                    {/* Simple creative visual representation of the app */}
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                        className="relative z-10 w-full h-full border-4 border-white/20 rounded-3xl flex flex-col p-4 bg-black/60 shadow-2xl"
                                    >
                                        <div className="h-6 w-1/3 bg-white/10 rounded-full mb-4"></div>
                                        <div className="flex-1 bg-gradient-to-br from-neon-red via-black to-blue-900 rounded-xl mb-4 relative overflow-hidden">
                                            <div className="absolute inset-x-0 bottom-4 text-center">
                                                <div className="h-3 w-3/4 bg-white/40 mx-auto rounded-full mb-2"></div>
                                                <div className="h-2 w-1/2 bg-white/20 mx-auto rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <div className="h-8 w-1/4 bg-white/5 rounded-lg"></div>
                                            <div className="h-8 w-1/4 bg-white/5 rounded-lg"></div>
                                            <div className="h-8 w-1/2 bg-neon-red rounded-lg"></div>
                                        </div>
                                    </motion.div>
                                </div>
                                <div className="mt-8 text-center">
                                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-neon-cyan mb-2">Social Studio App</p>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        {language === 'fr' ? "Une innovation Dropsiders pour professionnaliser le partage d'actualité électro." : "A Dropsiders innovation to professionalize electro news sharing."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-32 px-6 lg:px-12 xl:px-16 2xl:px-24 w-full">
                    <div className="text-center mb-16">
                        <p className="text-neon-red text-[10px] font-black tracking-[0.5em] uppercase mb-4">What we do</p>
                        <h2 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter">
                            {language === 'fr' ? "NOTRE SAVOIR-FAIRE" : "OUR EXPERTISE"}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.05, y: -10 }}


                                className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-colors group"
                            >
                                <motion.div
                                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                    transition={{ duration: 0.5 }}
                                    className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-neon-red group-hover:text-white transition-colors"
                                >
                                    {item.icon}
                                </motion.div>
                                <h3 className="text-lg font-bold uppercase tracking-widest mb-3">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{item.desc}</p>
                            </motion.div>
                        ))}
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
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">© 2024 DROPSIDERS MEDIA GROUP</p>
                        <p className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em]">CONFIDENTIAL DOCUMENT</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default KitMedia;
