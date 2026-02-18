
import { Mail, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export function Footer() {
    const { t } = useLanguage();

    const socialLinks = [
        { name: 'Instagram', icon: <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" className="w-6 h-6 object-contain filter group-hover:brightness-0 group-hover:invert-[0.20] group-hover:sepia-[0.95] group-hover:saturate-[6000%] group-hover:hue-rotate-[350deg]" />, href: 'https://instagram.com/dropsiders.eu', color: 'group-hover:border-neon-red group-hover:bg-neon-red/10' },
        { name: 'TikTok', icon: <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" className="w-6 h-6 object-contain filter group-hover:brightness-0 group-hover:invert-[0.20] group-hover:sepia-[0.95] group-hover:saturate-[6000%] group-hover:hue-rotate-[350deg]" />, href: 'https://tiktok.com/@dropsiders.eu', color: 'group-hover:border-neon-red group-hover:bg-neon-red/10' },
        { name: 'YouTube', icon: <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" className="w-6 h-6 object-contain filter group-hover:brightness-0 group-hover:invert-[0.20] group-hover:sepia-[0.95] group-hover:saturate-[6000%] group-hover:hue-rotate-[350deg]" />, href: 'https://www.youtube.com/@dropsiders', color: 'group-hover:border-neon-red group-hover:bg-neon-red/10' },
        { name: 'X', icon: <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" className="w-6 h-6 object-contain filter group-hover:brightness-0 group-hover:invert-[0.20] group-hover:sepia-[0.95] group-hover:saturate-[6000%] group-hover:hue-rotate-[350deg]" />, href: 'https://twitter.com/dropsiders', color: 'group-hover:border-neon-red group-hover:bg-neon-red/10' },
        { name: 'Facebook', icon: <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" className="w-6 h-6 object-contain filter group-hover:brightness-0 group-hover:invert-[0.20] group-hover:sepia-[0.95] group-hover:saturate-[6000%] group-hover:hue-rotate-[350deg]" />, href: 'https://www.facebook.com/dropsidersfr', color: 'group-hover:border-neon-red group-hover:bg-neon-red/10' }
    ];

    const navItems = [
        { label: t('nav.news'), path: '/news' },
        { label: t('nav.recaps'), path: '/recaps' },
        { label: t('nav.interviews'), path: '/interviews' },
        { label: t('nav.galleries'), path: '/galerie' },
        { label: t('nav.team'), path: '/team' },
        { label: t('footer.contact'), path: 'mailto:contact@dropsiders.fr' }
    ];

    return (
        <footer className="relative bg-dark-bg border-t border-white/5 overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-red/50 to-transparent" />

            <div className="max-w-7xl mx-auto px-6 py-20 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
                    {/* Brand Section */}
                    <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                        <div className="flex flex-col gap-6 items-center lg:items-start">
                            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <img src="/Logo.png" alt="DROPSIDERS" className="h-16 w-auto object-contain logo-footer cursor-pointer hover:opacity-80 transition-opacity" />
                            </Link>
                            <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-tight" dangerouslySetInnerHTML={{ __html: t('footer.slogan') }}>
                            </h2>
                        </div>
                        <p className="text-gray-400 text-lg font-light leading-relaxed max-w-md">
                            {t('footer.desc')}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
                            <Mail className="w-5 h-5 text-neon-red" />
                            <a href="mailto:contact@dropsiders.fr" className="hover:text-neon-red transition-colors">contact@dropsiders.fr</a>
                        </div>
                    </div>

                    {/* Social Section - "REJOIGNEZ-NOUS" */}
                    <div className="lg:col-span-4 space-y-8">
                        <h4 className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em]" dangerouslySetInnerHTML={{ __html: t('footer.community') }}></h4>
                        <div className="space-y-6">
                            <h3 className="text-xl font-display font-black text-white uppercase italic tracking-tight" dangerouslySetInnerHTML={{ __html: t('footer.join') }}></h3>
                            <div className="grid grid-cols-5 gap-3">
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
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                            <Link
                                to="/newsletter"
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="p-4 bg-neon-red/5 border border-neon-red/10 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-neon-red/10 transition-colors"
                            >
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('footer.subscribe')}</span>
                                <ExternalLink className="w-4 h-4 text-neon-red group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <div className="lg:col-span-3 space-y-8">
                        <h4 className="text-[10px] font-black text-neon-red uppercase tracking-[0.4em]">{t('footer.nav')}</h4>
                        <ul className="grid grid-cols-1 gap-4">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        to={item.path}
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="text-gray-400 hover:text-neon-red transition-colors text-sm font-bold uppercase tracking-tight flex items-center gap-2 group"
                                    >
                                        <div className="w-1 h-1 bg-neon-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Legal */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <span>© {new Date().getFullYear()} DROPSIDERS. {t('footer.rights')}</span>
                        <Link to="/admin" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-800 hover:text-neon-red transition-colors ml-2" title="Admin">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </Link>
                    </p>
                    <div className="flex flex-wrap justify-center gap-8 text-center">
                        <Link to="/politique-de-confidentialite" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">{t('footer.privacy')}</Link>
                        <Link to="/cgu" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">{t('footer.terms')}</Link>
                        <Link to="/mentions-legales" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">{t('footer.legal')}</Link>
                        <Link to="/cookies" className="text-[10px] font-black text-gray-500 hover:text-neon-red transition-colors uppercase tracking-widest">{t('footer.cookies')}</Link>
                    </div>
                </div>
            </div>
            {/* Corner Accent */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-neon-red/5 blur-[100px] pointer-events-none" />
        </footer >
    );
}
