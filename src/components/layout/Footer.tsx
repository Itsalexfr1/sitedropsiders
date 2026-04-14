import { Mail, Lock, Globe, Instagram, Youtube, Facebook, Twitter, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import settings from '../../data/settings.json';
import { NewsletterForm } from '../widgets/NewsletterForm';

const TiktokIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.82a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.25z" />
    </svg>
);

const SpotifyIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.4-2.1-10.6-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.7-1.1 8.7-.6 11.8 1.3.2.2.3.5.1.8zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-2-8.2-2.6-12-1.4-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 4.4-1.3 9.9-.7 13.6 1.6.3.3.4.8.1 1zM19.2 10.6c-3.9-2.3-10.3-2.5-14.1-1.4-.6.2-1.2-.2-1.4-.8-.2-.6.2-1.2.8-1.4 4.3-1.3 11.4-1.1 16 1.6.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.4v.1z" />
    </svg>
);

export function Footer() {
    const { t } = useLanguage();
    const [shopEnabled, setShopEnabled] = useState(settings.shop_enabled);
    const [shopPasswordProtected, setShopPasswordProtected] = useState((settings as any).shop_password_protected || false);
    const [socials, setSocials] = useState(settings.socials || { instagram: 'dropsiders.eu', tiktok: '@dropsiders.eu' });
    const [navLabels, setNavLabels] = useState((settings as any).nav_labels || {});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    setShopEnabled(data.shop_enabled);
                    setShopPasswordProtected(data.shop_password_protected || false);
                    if (data.socials) {
                        setSocials(data.socials);
                    }
                    if (data.nav_labels) {
                        setNavLabels(data.nav_labels);
                    }
                }
            } catch (e: any) {
                // Keep default
            }
        };
        fetchSettings();
    }, []);

    const ZoomText = ({ text, className = "" }: { text: string, className?: string }) => {
        return (
            <motion.span
                className={`inline-block relative cursor-default ${className}`}
                whileHover={{
                    scale: 1.05,
                    color: '#ff1111',
                    textShadow: "0 0 12px rgba(255,17,17,0.5)",
                    z: 10
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                {text}
            </motion.span>
        );
    };

    const getSocialUrl = (value: string, platform: 'instagram' | 'tiktok') => {
        if (!value) return '#';
        if (value.startsWith('http')) return value;
        if (platform === 'instagram') return `https://instagram.com/${value.replace('@', '')}`;
        if (platform === 'tiktok') return `https://tiktok.com/${value.startsWith('@') ? value : '@' + value}`;
        return value;
    };

    const socialLinks = [
        { name: 'Instagram', icon: <Instagram className="w-6 h-6" />, href: getSocialUrl(socials.instagram, 'instagram'), color: 'group-hover:border-neon-red group-hover:bg-neon-red/10 group-hover:text-neon-red' },
        { name: 'TikTok', icon: <TiktokIcon className="w-5 h-5 fill-current" />, href: getSocialUrl(socials.tiktok, 'tiktok'), color: 'group-hover:border-neon-red group-hover:bg-neon-red/10 group-hover:text-neon-red' },
        { name: 'Spotify', icon: <SpotifyIcon className="w-5 h-5 fill-current" />, href: `https://open.spotify.com/user/dropsiders`, color: 'group-hover:border-neon-red group-hover:bg-neon-red/10 group-hover:text-neon-red' },
        { name: 'YouTube', icon: <Youtube className="w-6 h-6" />, href: `https://www.youtube.com/@dropsiders`, color: 'group-hover:border-neon-red group-hover:bg-neon-red/10 group-hover:text-neon-red' },
        { name: 'X', icon: <Twitter className="w-6 h-6" />, href: `https://x.com/dropsidersfr`, color: 'group-hover:border-neon-red group-hover:bg-neon-red/10 group-hover:text-neon-red' },
        { name: 'Facebook', icon: <Facebook className="w-6 h-6" />, href: `https://www.facebook.com/dropsidersfr`, color: 'group-hover:border-neon-red group-hover:bg-neon-red/10 group-hover:text-neon-red' }
    ];

    const navItems = [
        { label: navLabels.news || t('nav.news'), path: '/news' },
        { label: navLabels.vols || t('nav.vols'), path: '/voyage/vols' },
        { label: navLabels.bus || t('nav.bus'), path: '/voyage/bus' },
        { label: navLabels.recaps || t('nav.recaps'), path: '/recaps' },
        { label: navLabels.interviews || t('nav.interviews'), path: '/interviews' },
        { label: navLabels.galerie || t('nav.galerie'), path: '/galerie' },
        { label: 'Clips', path: '/clips' },
        ...(shopEnabled && !shopPasswordProtected ? [{ label: navLabels.shop || t('nav.shop'), path: '/shop' }] : []),
        { label: navLabels.team || t('nav.team'), path: '/team' },
        { label: navLabels.contact || t('footer.contact'), path: '/contact' }
    ];

    return (
        <footer className="relative bg-dark-bg border-t border-white/5 overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-red/50 to-transparent" />

            <div className="w-full px-4 md:px-12 xl:px-16 2xl:px-24 py-20 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-16 mb-20">
                    {/* Brand Section */}
                    <motion.div
                        className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 group/brand w-full"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <div className="flex flex-col gap-6 items-center lg:items-start w-full">
                            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="block">
                                <img src="/Logo.png" alt="DROPSIDERS" className="logo-img h-12 md:h-16 w-auto max-w-[200px] md:max-w-none object-contain logo-footer cursor-pointer hover:opacity-80 transition-opacity" />
                            </Link>
                            <motion.h2
                                className="text-2xl md:text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-tight transition-all duration-300 w-full max-w-lg md:max-w-none px-4 md:px-0"
                                dangerouslySetInnerHTML={{ __html: t('footer.slogan') }}
                                whileHover={{
                                    scale: 1.08,
                                    textShadow: "0 0 20px rgba(255,17,17,0.4)"
                                }}
                            >
                            </motion.h2>
                        </div>
                        <ZoomText text={t('footer.desc')} className="text-gray-400 text-lg font-light leading-relaxed max-w-md" />

                        <div className="flex items-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
                            <Mail className="w-5 h-5 text-neon-red" />
                            <Link to="/contact" className="hover:text-neon-red transition-colors">contact@dropsiders.fr</Link>
                        </div>
                    </motion.div>

                    {/* Social Section - "REJOIGNEZ-NOUS" */}
                    <motion.div
                        className="lg:col-span-4 space-y-8 text-center lg:text-left group/social"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <h4 className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em] mb-4">
                            <ZoomText text={t('footer.community').replace(/<[^>]*>/g, '')} />
                        </h4>
                        <div className="space-y-6">
                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tight">
                                <ZoomText text={t('footer.join').replace(/<[^>]*>/g, '')} />
                            </h3>
                            <div className="grid grid-cols-6 gap-2 max-w-[300px] mx-auto lg:mx-0">
                                {socialLinks.map((social) => (
                                    <motion.a
                                        key={social.name}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ y: -5, scale: 1.1 }}
                                        className={`group flex items-center justify-center aspect-square bg-white/5 border border-white/10 rounded-xl transition-all duration-300 ${social.color}`}
                                        title={social.name}
                                    >
                                        <div className="text-gray-400 transition-colors">
                                            {social.icon}
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                            <div className="bg-gradient-to-br from-neon-red/10 to-neon-red/5 border border-neon-red/20 rounded-2xl px-5 py-6 text-center space-y-4 relative overflow-hidden group/form">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-neon-red/20 blur-3xl rounded-full" />
                                <div className="relative z-10 space-y-2">
                                    <div className="w-10 h-10 mx-auto bg-neon-red/20 rounded-full flex items-center justify-center border border-neon-red/30 group-hover/form:scale-110 transition-transform">
                                        <Mail className="w-5 h-5 text-neon-red" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-display font-black text-white uppercase italic tracking-tight" dangerouslySetInnerHTML={{ __html: t('article_detail.newsletter_title') }} />
                                        <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-relaxed">
                                            {t('article_detail.newsletter_subtitle')}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <NewsletterForm variant="compact" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Section */}
                    <motion.div
                        className="lg:col-span-3 space-y-8 group/nav"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <h4 className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em]">
                            <ZoomText text={t('footer.nav')} />
                        </h4>
                        <ul className="grid grid-cols-1 gap-4">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        to={item.path}
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="text-gray-400 hover:text-neon-red transition-colors text-sm font-bold uppercase tracking-tight flex items-center gap-2 group"
                                    >
                                        <div className="w-1 h-1 bg-neon-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <ZoomText text={item.label} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Bottom Bar: Copyright & Legal */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <ZoomText text={`© ${new Date().getFullYear()} DROPSIDERS. ${t('footer.rights')}`} />
                            <Link to="/admin" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-800 hover:text-neon-red transition-colors ml-2" title="Admin">
                                <Lock className="w-3 h-3" />
                            </Link>
                        </p>

                        <Link
                            to="/kit-media"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 hover:bg-white/10 transition-all group"
                        >
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/10 shadow-lg overflow-hidden shrink-0 group-hover:border-neon-red transition-colors">
                                <img src="/logo_presentation.png" alt="Dropsiders" className="w-full h-full object-contain p-1" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Kit Média</span>
                                <span className="text-[6px] font-black text-gray-700 uppercase tracking-widest mt-1">News • Récaps Events • Interviews • Concours</span>
                            </div>
                            <Globe className="w-4 h-4 text-gray-600 group-hover:text-neon-red transition-colors ml-2" />
                        </Link>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-center">
                        <Link to="/politique-de-confidentialite" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">
                            <ZoomText text={t('footer.privacy')} />
                        </Link>
                        <Link to="/cgu" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">
                            <ZoomText text={t('footer.terms')} />
                        </Link>
                        <Link to="/mentions-legales" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">
                            <ZoomText text={t('footer.legal')} />
                        </Link>
                        <Link to="/cookies" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">
                            <ZoomText text={t('footer.cookies')} />
                        </Link>
                    </div>
                </div>

                {/* Powered By Section */}
                <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-2">
                        Powered by <span className="text-neon-red">WebSiders</span>
                    </p>
                </div>
            </div>
            {/* Corner Accent */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-red/5 blur-[100px] pointer-events-none" />
        </footer>
    );
}
