import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Globe, 
    Sparkles, 
    Code2, 
    Zap, 
    ShieldCheck, 
    Smartphone, 
    Layers, 
    ArrowRight, 
    CheckCircle2, 
    Radio, 
    ShoppingBag, 
    Calendar, 
    Palette, 
    Database, 
    Mail
} from 'lucide-react';
import { SEO } from '../components/utils/SEO';

export function Websiders() {
    const services = [
        {
            icon: <Globe className="w-6 h-6 text-neon-cyan" />,
            title: "Sites Vitrines & Portfolios",
            desc: "Designs immersifs, identités visuelles fortes et expérience utilisateur haut de gamme pour artistes, DJ, agences et créateurs."
        },
        {
            icon: <Radio className="w-6 h-6 text-neon-red" />,
            title: "Plateformes Médias & Streaming",
            desc: "Lecteurs web radio continus, chaînes TV 24/7, gestion de flux live et intégrations audiovisuelles avancées."
        },
        {
            icon: <Calendar className="w-6 h-6 text-neon-purple" />,
            title: "Événements & Billetterie",
            desc: "Agendas interactifs, modules de festivals/clubs, plans géolocalisés, compteurs et redirection billetterie optimisée."
        },
        {
            icon: <ShoppingBag className="w-6 h-6 text-emerald-400" />,
            title: "E-Commerce & Merchandising",
            desc: "Boutiques en ligne modernes, tunnels d'achat ultra-rapides avec Stripe et gestion des stocks en temps réel."
        },
        {
            icon: <Database className="w-6 h-6 text-amber-400" />,
            title: "Dashboards & CMS Sur Mesure",
            desc: "Espaces d'administration intuitifs pour piloter vos articles, vos médias, vos membres et vos statistiques en totale autonomie."
        },
        {
            icon: <Smartphone className="w-6 h-6 text-blue-400" />,
            title: "Progressive Web Apps (PWA)",
            desc: "Sites installables directement sur smartphones (iOS & Android) sans passer par les stores, avec fonctionnement hors-ligne."
        }
    ];

    const highlights = [
        { title: "Vitesse Flash", desc: "Chargement en moins de 0.5s grâce à l'architecture Edge CDN Cloudflare mondiale." },
        { title: "Design 100% Unique", desc: "Aucun template générique : chaque pixel est pensé pour refléter l'identité de votre marque." },
        { title: "SEO & Référencement", desc: "Optimisation technique native pour dominer les résultats Google et Bing." },
        { title: "Sécurité & Haute Disponibilité", desc: "Protection anti-DDoS, SSL automatique et tolérance aux pics de trafic massifs." }
    ];

    const steps = [
        { step: "01", title: "Cadrage & Vision", desc: "Analyse de vos besoins, de votre audience cible et définition de l'arborescence du projet." },
        { step: "02", title: "Design & Prototype", desc: "Conception de maquettes interactives modernes intégrant votre univers graphique et vos couleurs." },
        { step: "03", title: "Développement & Intégration", desc: "Programmation avec les technologies web les plus performantes (React, Vite, Edge Workers)." },
        { step: "04", title: "Lancement & Suivi", desc: "Mise en ligne sous votre nom de domaine, formation à l'administration et accompagnement continu." }
    ];

    return (
        <div className="min-h-screen bg-dark-bg pt-28 pb-32 px-4 sm:px-6 relative overflow-hidden text-white font-sans">
            <SEO 
                title="Websiders · Solution de Création de Site Web par Dropsiders"
                description="Websiders est la solution de création de sites web sur-mesure propulsée par Dropsiders. Conception de plateformes modernes, rapides et immersives."
            />

            {/* Ambient Background Glows */}
            <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[40rem] h-[25rem] bg-gradient-to-r from-neon-red/15 via-neon-purple/10 to-neon-cyan/15 blur-[140px] pointer-events-none rounded-full" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-neon-cyan/10 blur-[120px] pointer-events-none rounded-full" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-24">
                
                {/* HERO SECTION */}
                <motion.div 
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-center space-y-6 pt-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,17,17,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-neon-red animate-pulse" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-gray-300">
                            DROPSIDERS PRÉSENTE
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black italic tracking-tighter uppercase leading-[0.95]">
                        <span className="text-white">WEB</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan">SIDERS</span>
                        <span className="text-neon-cyan">FR</span>
                    </h1>

                    <p className="text-lg sm:text-2xl font-bold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 max-w-2xl mx-auto">
                        Solution de création de site web sur-mesure & haute performance
                    </p>

                    <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Propulsée par l’expertise technique et visuelle développée pour <strong>Dropsiders</strong>. 
                        Nous créons des plateformes web immersives, ultra-rapides et taillées pour captiver votre audience.
                    </p>

                    <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                        <Link 
                            to="/contact?to=Alex&subject=Demande%20Projet%20Websiders"
                            className="px-8 py-4 rounded-xl bg-gradient-to-r from-neon-red to-orange-600 text-white font-black uppercase tracking-wider text-xs md:text-sm hover:shadow-[0_0_30px_rgba(255,17,17,0.5)] transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            <span>Démarrer un projet</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a 
                            href="#solutions"
                            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-bold uppercase tracking-wider text-xs md:text-sm transition-all backdrop-blur-md"
                        >
                            Découvrir les solutions
                        </a>
                    </div>
                </motion.div>

                {/* SHOWCASE / STATS CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Temps de chargement moyen", value: "< 0.5s", color: "text-neon-cyan" },
                        { label: "Disponibilité & Uptime", value: "99.9%", color: "text-emerald-400" },
                        { label: "Design Responsive", value: "100%", color: "text-neon-red" },
                        { label: "Autonomie CMS Client", value: "Totale", color: "text-neon-purple" },
                    ].map((stat, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                            <div className={`text-2xl sm:text-3xl font-display font-black italic tracking-tight ${stat.color}`}>
                                {stat.value}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* SOLUTIONS SECTION */}
                <div id="solutions" className="space-y-10">
                    <div className="text-center space-y-3">
                        <h2 className="text-xs font-black text-neon-red uppercase tracking-[0.3em]">Notre Savoir-Faire</h2>
                        <h3 className="text-2xl sm:text-4xl font-display font-black text-white italic tracking-tight uppercase">
                            Des sites conçus pour faire la différence
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((srv, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="p-7 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-neon-cyan/40 hover:bg-white/[0.05] transition-all space-y-4 group relative overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {srv.icon}
                                </div>
                                <h4 className="text-lg font-display font-black text-white italic tracking-tight uppercase group-hover:text-neon-cyan transition-colors">
                                    {srv.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-light">
                                    {srv.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* PROCESS SECTION */}
                <div className="space-y-10">
                    <div className="text-center space-y-3">
                        <h2 className="text-xs font-black text-neon-cyan uppercase tracking-[0.3em]">La Méthode Websiders</h2>
                        <h3 className="text-2xl sm:text-4xl font-display font-black text-white italic tracking-tight uppercase">
                            De l'idée à la mise en ligne en 4 étapes
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((st, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 space-y-3 relative">
                                <span className="text-3xl font-display font-black text-white/20 italic">
                                    {st.step}
                                </span>
                                <h4 className="text-base font-bold text-white uppercase italic tracking-tight">
                                    {st.title}
                                </h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {st.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA BOX */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-neon-red/15 via-black/80 to-neon-cyan/15 border border-white/10 text-center space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(255,17,17,0.15)]"
                >
                    <div className="max-w-xl mx-auto space-y-4">
                        <h3 className="text-2xl sm:text-4xl font-display font-black text-white uppercase italic tracking-tight">
                            Vous avez un projet de site web ?
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Parlez-nous de vos besoins, de vos objectifs et recevez une proposition personnalisée.
                        </p>
                        <div className="pt-2">
                            <Link 
                                to="/contact?to=Alex&subject=Demande%20de%20devis%20Websiders"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-black uppercase tracking-wider text-xs sm:text-sm hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all transform hover:scale-105"
                            >
                                <Mail className="w-4 h-4" />
                                <span>Demander un devis gratuit</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

