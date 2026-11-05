import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Globe, 
    Sparkles, 
    Code2, 
    Zap, 
    ShieldCheck, 
    Smartphone, 
    ArrowRight, 
    CheckCircle2, 
    Radio, 
    ShoppingBag, 
    Calendar, 
    Database, 
    Mail,
    Server,
    TrendingUp,
    Users,
    Layers,
    Cpu,
    ExternalLink,
    HelpCircle,
    ArrowLeft,
    Send,
    Phone,
    Clock,
    DollarSign,
    Check,
    Tv,
    Play,
    Volume2,
    Sliders,
    Eye,
    Lock,
    Award,
    Instagram,
    Share2,
    Download,
    Maximize2,
    X,
    Palette
} from 'lucide-react';
import { SEO } from '../components/utils/SEO';

export function Websiders() {
    // Form state
    const formRef = useRef<HTMLDivElement>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [projectType, setProjectType] = useState('Site Vitrine / Portfolio');
    const [budget, setBudget] = useState('500 € – 1 500 €');
    const [timeline, setTimeline] = useState('⚡ Livraison Express (Sous 1 semaine max)');
    const [description, setDescription] = useState('');

    // Active Dashboard Modal Tab Preview
    const [activeModalTab, setActiveModalTab] = useState<'radio' | 'tv' | 'agenda' | 'social' | 'team'>('social');

    // Lightbox image preview state
    const [previewImage, setPreviewImage] = useState<{ src: string; title: string; subtitle: string } | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const scrollToForm = (presetType?: string, presetBudget?: string) => {
        if (presetType) setProjectType(presetType);
        if (presetBudget) setBudget(presetBudget);
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !description.trim()) {
            setErrorMessage('Veuillez renseigner votre nom, email et la description de votre projet.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || undefined,
                    projectType,
                    budget,
                    timeline,
                    subject: `Demande de devis : ${projectType} (${budget})`,
                    message: `Type de projet : ${projectType}
Budget envisagé : ${budget}
Délai souhaité : ${timeline}
Téléphone : ${phone.trim() || 'Non renseigné'}

Description du projet :
${description.trim()}`,
                    recipient: 'alex@dropsiders.fr',
                    source: 'websiders'
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Erreur lors de l’envoi de votre demande.');
            }

            setIsSuccess(true);
            setName('');
            setEmail('');
            setPhone('');
            setDescription('');
        } catch (err: any) {
            setErrorMessage(err.message || 'Une erreur est survenue lors de l’envoi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Social Studio gallery items with real screenshots
    const socialStudioPhotos = [
        {
            src: "/social-studio-previews/social-news-story.jpg",
            title: "Story News & Annonce Électro",
            format: "Format 9:16 (Story / Reel)",
            desc: "Génération automatique du visuel d'actualité avec accroche, photo de scène et lien swipe-up vers le site."
        },
        {
            src: "/social-studio-previews/social-mockup-render.jpg",
            title: "Mise en Scène 3D Smartphone",
            format: "Rendu 3D Photoréaliste",
            desc: "Visualisation ultra-réaliste de votre site web intégré sur écran de smartphone pour vos campagnes Instagram."
        },
        {
            src: "/social-studio-previews/social-promo-slide.jpg",
            title: "Slide Promotionnelle & Call To Action",
            format: "Format Carré & Story",
            desc: "Visuels promotionnels avec typographie percutante, logos officiels et badges d'engagement pour vos réseaux."
        },
        {
            src: "/social-studio-previews/social-story-quote.jpg",
            title: "Carrousel Citations & Interviews",
            format: "Format Slide Réseaux",
            desc: "Mise en valeur d'extraits d'interviews, citations d'artistes ou déclarations phares sans logiciel de retouche."
        },
        {
            src: "/social-studio-previews/social-artist-slide.jpg",
            title: "Fiche Artiste & Annonce Festival",
            format: "Line-Up & Dates",
            desc: "Annonce d'artistes et programmation festival prête à publier avec alignement parfait et charte respectée."
        },
        {
            src: "/social-studio-previews/social-top100-slide.png",
            title: "Classements & Top 100",
            format: "Grille de Résultats",
            desc: "Mise en forme dynamique des classements, votes Top 5 et sondages communautaires en 1 clic."
        }
    ];

    const architecturePillars = [
        {
            icon: <Code2 className="w-6 h-6 text-neon-cyan" />,
            badge: "FRONT-END & PWA",
            title: "Technologie React 19 & PWA",
            valueAgency: "Livraison sous 1 semaine max",
            points: [
                "Développement 100% sur mesure en React, TypeScript et Tailwind CSS (aucun CMS lourd)",
                "PWA installable sur smartphone (iOS / Android) comme une véritable application",
                "Temps de réponse instantané (< 0.5s) avec animations fluides 60 FPS (Framer Motion)",
                "Support multi-langues natif (FR / EN) avec mémorisation instantanée"
            ]
        },
        {
            icon: <Radio className="w-6 h-6 text-neon-red" />,
            badge: "AUDIO & STREAMING",
            title: "Web Radio 24/7 & Flux TV",
            valueAgency: "Lecteur persistant sans coupure",
            points: [
                "Lecteur audio persistant qui ne coupe jamais lors de la navigation sur le site",
                "Affichage des métadonnées du titre en direct, votes Top 5 et intégration Shoutcast/Icecast",
                "Dropsiders TV : chaîne vidéo continue avec enchaînement automatisé des flux",
                "Studio visuel intégré pour générer des stories et visuels réseaux en 1 clic"
            ]
        },
        {
            icon: <Sparkles className="w-6 h-6 text-purple-400" />,
            badge: "RÉSEAUX SOCIAUX",
            title: "Social Studio 1-Clic Intégré",
            valueAgency: "Économie de 500€/m sur Canva/Photoshop",
            points: [
                "Générateur automatique de stories Instagram (9:16) et posts réseaux sociaux (1:1)",
                "Export direct haute définition en PNG & MP4 prêt à publier en 2 secondes",
                "Rendu 3D smartphone photoréaliste intégré pour valoriser votre site",
                "Palettes thématiques adaptatives (News, Festivals, Interviews, Concours)"
            ]
        },
        {
            icon: <Server className="w-6 h-6 text-neon-purple" />,
            badge: "INFRASTRUCTURE EDGE",
            title: "Cloudflare Serverless & CDN Mondial",
            valueAgency: "Zéro latence mondiale",
            points: [
                "Code exécuté sur plus de 330 datacenters dans le monde pour une latence nulle",
                "Résistance native aux pics de millions de requêtes sans jamais faire tomber le serveur",
                "Stockage médias Cloudflare R2 (photos, vidéos, musiques) sans frais de bande passante",
                "Sécurité militaire : bouclier anti-DDoS automatique et certificats SSL bancaires"
            ]
        },
        {
            icon: <Database className="w-6 h-6 text-emerald-400" />,
            badge: "CMS & ADMINISTRATION",
            title: "Dashboard Admin & Mails d'Équipe",
            valueAgency: "Modals intuitives sans code",
            points: [
                "Espace d'administration propriétaire intuitif sans aucune compétence technique requise",
                "Gestion fine des rôles et permissions par rédacteur, photographe ou modérateur",
                "Boîtes mails officielles personnalisées avec routage automatique Brevo",
                "Outils intégrés de nettoyage automatique des médias et détection d'erreurs en direct"
            ]
        },
        {
            icon: <ShoppingBag className="w-6 h-6 text-amber-400" />,
            badge: "BUSINESS & AUTOMATION",
            title: "E-Commerce Stripe & Newsletters",
            valueAgency: "Tunnel de paiement sécurisé",
            points: [
                "Boutique en ligne moderne avec tunnel d'achat express et paiements Stripe sécurisés",
                "Génération automatique de factures PDF conformes et suivi des ventes",
                "Campagnes de newsletters automatisées et segmentation des abonnés via Brevo",
                "Système de billetterie, agenda festival et géolocalisation des événements"
            ]
        }
    ];

    const pricingPlans = [
        {
            name: "STARTER VITRINE",
            price: "290 €",
            badge: "Livraison sous 1 semaine max",
            projectTypeValue: "Site Vitrine / Portfolio",
            budgetValue: "200 € – 500 €",
            desc: "Pour créateurs, DJs, artistes et indépendants voulant une présence web ultra-stylée et moderne.",
            features: [
                "Site vitrine immersif 1 à 3 pages",
                "Design sombre néon 100% sur-mesure",
                "Progressive Web App (installable smartphone)",
                "Formulaire de contact intelligent avec notifications",
                "Optimisation SEO Google & Réseaux sociaux",
                "⚡ Livraison garantie sous 1 semaine maximum",
                "Hébergement Edge Cloudflare inclus"
            ],
            color: "border-white/10 hover:border-neon-cyan/50",
            btnColor: "bg-white/10 hover:bg-neon-cyan hover:text-black",
            btnText: "Choisir ce Pack"
        },
        {
            name: "PRO & CRÉATEUR",
            price: "890 €",
            badge: "Le Plus Populaire",
            featured: true,
            projectTypeValue: "Plateforme Pro & Créateur",
            budgetValue: "500 € – 1 500 €",
            desc: "Pour les marques, labels et médias en expansion ayant besoin de publier du contenu en totale autonomie.",
            features: [
                "Tout le pack Starter inclus",
                "Pages illimitées (Articles, Événements, Galerie)",
                "Dashboard d'administration complet sans code",
                "Social Studio intégré pour générer des stories",
                "Multi-éditeurs avec gestion des permissions",
                "Newsletter intégrée et collecte d'emails",
                "Adresses emails professionnelles personnalisées",
                "⚡ Livraison garantie sous 1 semaine maximum"
            ],
            color: "border-neon-red/60 bg-gradient-to-b from-neon-red/10 via-white/[0.02] to-transparent shadow-[0_0_35px_rgba(255,17,17,0.2)]",
            btnColor: "bg-gradient-to-r from-neon-red to-orange-600 hover:shadow-[0_0_30px_rgba(255,17,17,0.6)] text-white",
            btnText: "Choisir ce Pack"
        },
        {
            name: "MÉDIA & SUR-MESURE",
            price: "2 490 €",
            badge: "L'Équivalent Dropsiders",
            projectTypeValue: "Média, Web Radio & Streaming",
            budgetValue: "1 500 € – 3 000 €",
            desc: "La réplique exacte de notre architecture complète pour les projets médias et événementiels d'envergure (de 2 000 € à 5 000 € max).",
            features: [
                "Tout le pack Pro & Créateur inclus",
                "Web Radio 24/7 avec lecteur audio persistant",
                "Dropsiders TV vidéo avec streaming continu",
                "Social Studio Pro complet avec exports 3D",
                "Boutique E-commerce & Billetterie Stripe",
                "Routage d'emails complexe & copies invisibles",
                "⚡ Livraison clé en main sous 1 semaine maximum",
                "Accompagnement VIP & évolutions sur mesure"
            ],
            color: "border-white/10 hover:border-neon-purple/50",
            btnColor: "bg-white/10 hover:bg-neon-purple hover:text-white",
            btnText: "Demander un Devis"
        }
    ];

    const projectTypes = [
        "Site Vitrine / Portfolio",
        "Plateforme Pro & Créateur",
        "Média, Web Radio & Streaming",
        "E-Commerce & Billetterie",
        "Autre / Sur-Mesure"
    ];

    const budgetOptions = [
        "200 € – 500 €",
        "500 € – 1 500 €",
        "1 500 € – 3 000 €",
        "3 000 € – 5 000 €"
    ];

    const timelineOptions = [
        "⚡ Livraison Express (Sous 1 semaine max)",
        "1 à 2 semaines",
        "Pas d'urgence"
    ];

    return (
        <div className="min-h-screen bg-[#07080c] text-white font-sans selection:bg-neon-cyan selection:text-black">
            <SEO 
                title="WebsidersFR · Solution de Création de Site Web par Dropsiders"
                description="Websiders est la solution de création de sites web sur-mesure propulsée par Dropsiders. Tarifs de 200€ à 5 000€, livraison garantie sous 1 semaine maximum."
            />

            {/* ─── DEDICATED WEBSIDERS HEADER ─── */}
            <header className="sticky top-0 z-50 bg-[#07080c]/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link to="/websiders" className="flex items-center gap-2 group">
                        <span className="text-xl sm:text-2xl font-display font-black italic tracking-tighter uppercase">
                            <span className="text-neon-red">WEB</span>
                            <span className="text-neon-cyan">SIDERS</span>
                            <span className="text-white ml-0.5">FR</span>
                        </span>
                        <span className="hidden sm:inline-block text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono">
                            Par Dropsiders
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider font-bold text-gray-300">
                        <a href="#modals-dashboard" className="hover:text-neon-cyan transition-colors">Aperçu Dashboard</a>
                        <a href="#social-studio" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>Social Studio</span>
                        </a>
                        <a href="#estimation" className="hover:text-neon-cyan transition-colors">Prix & Délais</a>
                        <a href="#piliers" className="hover:text-neon-cyan transition-colors">Technologies</a>
                        <a href="#tarifs" className="hover:text-neon-cyan transition-colors">Formules</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => scrollToForm()}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-neon-red to-orange-600 text-white font-black uppercase tracking-wider text-[11px] hover:shadow-[0_0_20px_rgba(255,17,17,0.4)] transition-all cursor-pointer"
                        >
                            Demander un devis
                        </button>
                        <Link 
                            to="/"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wider"
                            title="Revenir sur Dropsiders.fr"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Dropsiders</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Ambient Background Lights */}
            <div className="relative overflow-hidden pt-12 pb-24 px-4 sm:px-6">
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[55rem] h-[28rem] bg-gradient-to-r from-neon-red/15 via-neon-purple/10 to-neon-cyan/15 blur-[170px] pointer-events-none rounded-full" />
                <div className="absolute top-1/2 right-0 w-[35rem] h-[35rem] bg-neon-cyan/10 blur-[160px] pointer-events-none rounded-full" />
                <div className="absolute bottom-1/4 left-0 w-[30rem] h-[30rem] bg-neon-red/10 blur-[150px] pointer-events-none rounded-full" />

                <div className="max-w-6xl mx-auto relative z-10 space-y-24">
                    
                    {/* 1. HERO SECTION */}
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

                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-black italic tracking-tighter uppercase leading-[0.95]">
                            <span className="text-white">WEB</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red via-neon-purple to-neon-cyan">SIDERS</span>
                            <span className="text-neon-cyan">FR</span>
                        </h1>

                        <p className="text-lg sm:text-2xl font-bold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 max-w-2xl mx-auto">
                            Solution de création de site web sur-mesure & haute performance
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-xs font-bold uppercase tracking-wider">
                                💰 Tarifs de 200 € à 5 000 € Max
                            </span>
                            <span className="px-3 py-1 rounded-full bg-neon-red/15 border border-neon-red/30 text-neon-red text-xs font-bold uppercase tracking-wider">
                                ⚡ Livraison sous 1 semaine maximum
                            </span>
                            <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
                                🎨 Social Studio Inclus
                            </span>
                        </div>

                        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            L'ingénierie, la vitesse et le design immersif qui propulsent un média de <strong>plus de 60 000 passionnés</strong>, 
                            désormais mis au service de votre projet, marque, artiste ou festival.
                        </p>

                        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                            <button 
                                onClick={() => scrollToForm()}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-neon-red to-orange-600 text-white font-black uppercase tracking-wider text-xs md:text-sm hover:shadow-[0_0_30px_rgba(255,17,17,0.5)] transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                            >
                                <span>Démarrer un projet</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <a 
                                href="#social-studio"
                                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/40 text-gray-300 hover:text-white font-bold uppercase tracking-wider text-xs md:text-sm transition-all backdrop-blur-md flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span>Découvrir le Social Studio</span>
                            </a>
                        </div>
                    </motion.div>

                    {/* 2. SHOWCASE DES MODALS DU TABLEAU DE BORD (RADIO, TV, AGENDA, SOCIAL, TEAM) */}
                    <div id="modals-dashboard" className="space-y-8">
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[10px] font-black uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5" />
                                BACK-OFFICE & OUTILS D'ADMINISTRATION
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-display font-black text-white italic tracking-tight uppercase">
                                Les Modals & Écrans du Dashboard Dropsiders
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto">
                                Découvrez en direct les interfaces réelles qui pilotent la Radio 24/7, la régie TV, l'agenda festivals et le Social Studio. Votre futur site disposera des mêmes outils intuitifs sans code.
                            </p>
                        </div>

                        {/* Interactive Tabs */}
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                            {[
                                { id: 'social', label: 'Social Studio 1-Clic', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
                                { id: 'radio', label: 'Studio Radio 24/7', icon: <Radio className="w-4 h-4" /> },
                                { id: 'tv', label: 'Régie Dropsiders TV', icon: <Tv className="w-4 h-4" /> },
                                { id: 'agenda', label: 'Gestionnaire Agenda', icon: <Calendar className="w-4 h-4" /> },
                                { id: 'team', label: 'Rôles & Permissions', icon: <Users className="w-4 h-4" /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveModalTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                        activeModalTab === tab.id
                                            ? 'bg-neon-cyan/20 border border-neon-cyan text-white shadow-[0_0_20px_rgba(0,255,213,0.3)]'
                                            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Modal Frame Window */}
                        <div className="p-4 sm:p-6 rounded-3xl bg-[#0c0e15] border border-white/15 shadow-2xl relative overflow-hidden">
                            {/* Window Top Bar */}
                            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                                    <span className="text-[11px] font-mono text-gray-400 ml-2">
                                        dropsiders-admin://{activeModalTab}-modal
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-400 font-mono">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    Système Actif · Production Live
                                </div>
                            </div>

                            {/* TAB 1: SOCIAL STUDIO PHOTOS & CONTROLS */}
                            {activeModalTab === 'social' && (
                                <motion.div 
                                    key="social"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-black/40 to-neon-red/10 border border-purple-500/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                                <Sparkles className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-black uppercase tracking-widest">
                                                        SOCIAL STUDIO PRO
                                                    </span>
                                                    <span className="text-xs font-mono text-gray-400">Générateur 1-Clic Stories & Posts</span>
                                                </div>
                                                <h3 className="text-lg sm:text-xl font-display font-black text-white italic tracking-tight uppercase mt-0.5">
                                                    Création Automatique de Visuels Réseaux Sociaux
                                                </h3>
                                                <p className="text-xs text-purple-300 font-mono">26 Palettes Automatiques · Export PNG HD & MP4 en 2 secondes</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a 
                                                href="#social-studio" 
                                                className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                                            >
                                                <span>Voir la galerie photo</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Real Photos Grid inside the modal */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[
                                            { src: "/social-studio-previews/social-news-story.jpg", title: "Story News 9:16", badge: "News & Actu" },
                                            { src: "/social-studio-previews/social-mockup-render.jpg", title: "Rendu 3D Mobile", badge: "Mockup 3D" },
                                            { src: "/social-studio-previews/social-promo-slide.jpg", title: "Slide Promo Néon", badge: "Engagement" },
                                            { src: "/social-studio-previews/social-story-quote.jpg", title: "Citation & Interview", badge: "Carrousel" }
                                        ].map((photo, pIdx) => (
                                            <div 
                                                key={pIdx}
                                                onClick={() => setPreviewImage({ src: photo.src, title: photo.title, subtitle: photo.badge })}
                                                className="group relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-purple-400/60 transition-all cursor-pointer shadow-lg"
                                            >
                                                <div className="aspect-[9/14] w-full overflow-hidden">
                                                    <img 
                                                        src={photo.src} 
                                                        alt={photo.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">{photo.badge}</span>
                                                    <p className="text-xs font-bold text-white uppercase">{photo.title}</p>
                                                    <div className="mt-1 flex items-center gap-1 text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Maximize2 className="w-3 h-3 text-neon-cyan" />
                                                        <span>Cliquer pour agrandir</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            <span>Aucun besoin de graphiste : chaque article rédigé génère sa story en 1 clic</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-neon-cyan">Économisez 500 € à 1 500 € / mois de frais de community management</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 2: STUDIO RADIO 24/7 */}
                            {activeModalTab === 'radio' && (
                                <motion.div 
                                    key="radio"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-neon-red/15 via-black/40 to-transparent border border-neon-red/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-neon-red/20 border border-neon-red/40 flex items-center justify-center text-neon-red shrink-0 shadow-[0_0_20px_rgba(255,17,17,0.3)]">
                                                <Radio className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-full bg-neon-red text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                        ● EN DIRECT
                                                    </span>
                                                    <span className="text-xs font-mono text-gray-400">Stream 320 Kbps HD</span>
                                                </div>
                                                <h3 className="text-lg sm:text-xl font-display font-black text-white italic tracking-tight uppercase mt-0.5">
                                                    Circoloco DC-10 Ibiza (Summer Edition)
                                                </h3>
                                                <p className="text-xs text-neon-cyan font-mono">Artiste : Ricardo Villalobos · Feel The Drop</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                                                👥 1 420 auditeurs connectés
                                            </span>
                                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-400">
                                                Statut : Stable (99.9%)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Waveform visualizer mock */}
                                    <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Spectre Audio Électro Live</span>
                                            <span className="text-neon-cyan font-mono">Gain: +0.2 dB · Auto-Limiter ON</span>
                                        </div>
                                        <div className="h-16 flex items-end gap-1 px-2 py-1 bg-[#090b10] rounded-xl overflow-hidden border border-white/5">
                                            {[40, 65, 80, 45, 90, 75, 30, 85, 95, 60, 40, 70, 88, 100, 65, 45, 80, 92, 50, 75, 85, 60, 95, 70, 40, 80, 60, 90, 45, 85, 70, 50].map((h, idx) => (
                                                <div 
                                                    key={idx} 
                                                    style={{ height: `${h}%` }}
                                                    className={`flex-1 rounded-t-sm transition-all duration-300 ${
                                                        idx % 3 === 0 ? 'bg-neon-red' : idx % 2 === 0 ? 'bg-neon-cyan' : 'bg-purple-500'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Controls Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Flux Shoutcast / Icecast</span>
                                            <p className="text-xs font-mono text-white">live.dropsiders.fr:8000/stream</p>
                                            <span className="text-[10px] text-emerald-400 font-semibold">✓ Synchronisation continue</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Lecteur Persistant</span>
                                            <p className="text-xs font-bold text-neon-cyan">Ne coupe jamais en naviguant</p>
                                            <span className="text-[10px] text-gray-400">Mini-player discret en bas d'écran</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Top 5 & Votes Communauté</span>
                                            <p className="text-xs font-bold text-white">Classement hebdomadaire interactif</p>
                                            <span className="text-[10px] text-neon-red font-semibold">Votes sécurisés anti-spam</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 3: RÉGIE DROPSIDERS TV */}
                            {activeModalTab === 'tv' && (
                                <motion.div 
                                    key="tv"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Video Monitor */}
                                        <div className="lg:col-span-2 p-5 rounded-2xl bg-black border border-white/10 space-y-3 relative overflow-hidden group">
                                            <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-purple-950/40 via-black to-red-950/30 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-neon-red text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                        ● DIRECT TV 1080p
                                                    </span>
                                                    <span className="text-[10px] font-mono text-gray-300 bg-black/60 px-2 py-0.5 rounded">
                                                        Tomorrowland Mainstage Set
                                                    </span>
                                                </div>
                                                <div className="w-16 h-16 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center text-neon-cyan shadow-[0_0_25px_rgba(0,255,213,0.4)] group-hover:scale-110 transition-transform">
                                                    <Play className="w-7 h-7 fill-current ml-1" />
                                                </div>
                                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-gray-400 font-mono bg-black/70 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <span>Flux HLS / YouTube Studio Sync</span>
                                                    <span>Enchaînement automatique sans écran noir</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Program playlist */}
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 flex flex-col justify-between">
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">
                                                    Grille des programmes TV
                                                </span>
                                                <div className="space-y-2">
                                                    {[
                                                        { time: "En cours", title: "Cercle Live at Pyramids", active: true },
                                                        { time: "14:30", title: "Defqon.1 Endshow Festival", active: false },
                                                        { time: "16:00", title: "Ultra Miami Mainstage Recap", active: false },
                                                        { time: "18:00", title: "Interviews Exclusives DJs", active: false }
                                                    ].map((item, idx) => (
                                                        <div 
                                                            key={idx}
                                                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                                                item.active 
                                                                    ? 'bg-neon-red/15 border-neon-red/40 text-white' 
                                                                    : 'bg-white/5 border-white/5 text-gray-400'
                                                            }`}
                                                        >
                                                            <span className="font-mono text-[10px] font-bold">{item.time}</span>
                                                            <span className="font-semibold truncate max-w-[150px]">{item.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className="w-full py-2.5 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-bold text-xs uppercase tracking-wider hover:bg-neon-cyan hover:text-black transition-all">
                                                + Ajouter un flux vidéo
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 4: GESTIONNAIRE AGENDA */}
                            {activeModalTab === 'agenda' && (
                                <motion.div 
                                    key="agenda"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                                        <div>
                                            <h3 className="text-lg font-display font-black text-white uppercase italic">
                                                Gestionnaire d'Événements & Billetterie
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                142 festivals référencés avec géolocalisation, dates et liens billetteries affiliés
                                            </p>
                                        </div>
                                        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-neon-red to-orange-600 text-white font-bold text-xs uppercase tracking-wider">
                                            + Ajouter un Festival
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { name: "Tomorrowland 2026", date: "17 - 26 Juillet 2026", place: "Boom, Belgique", status: "Complet", clics: "14 200 clics" },
                                            { name: "Electrobeach EMF", date: "10 - 12 Juillet 2026", place: "Barcarès, France", status: "Billetterie Ouverte", clics: "8 940 clics" },
                                            { name: "Awakenings Festival", date: "11 - 13 Juillet 2026", place: "Hilvarenbeek, Pays-Bas", status: "Bientôt Sold Out", clics: "6 310 clics" }
                                        ].map((fest, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-neon-cyan/40 transition-all space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                                                        {fest.place}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-emerald-400">
                                                        {fest.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white uppercase">{fest.name}</h4>
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5">{fest.date}</p>
                                                </div>
                                                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neon-cyan">
                                                    <span>{fest.clics}</span>
                                                    <span className="hover:underline cursor-pointer">Modifier la fiche →</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 5: RÔLES & PERMISSIONS */}
                            {activeModalTab === 'team' && (
                                <motion.div 
                                    key="team"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                                        <div>
                                            <h3 className="text-lg font-display font-black text-white uppercase italic">
                                                Équipe, Boîtes Mails & Permissions
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                Chaque membre dispose de son accès sécurisé et de son adresse email officielle avec routage automatique
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                                            ✓ Protection Brevo Active
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            { role: "SuperAdmin / Fondateur", mail: "alex@dropsiders.fr", badge: "Accès Total", color: "text-neon-red" },
                                            { role: "Rédacteurs en Chef", mail: "redaction@dropsiders.fr", badge: "Gestion News & Interviews", color: "text-neon-cyan" },
                                            { role: "Photographes & Événements", mail: "photos@dropsiders.fr", badge: "Upload Galerie & Recaps", color: "text-purple-400" },
                                            { role: "Partenariats & Régie Pub", mail: "contact@dropsiders.fr", badge: "Gestion Devis & Mails", color: "text-amber-400" }
                                        ].map((m, idx) => (
                                            <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className={`font-bold ${m.color}`}>{m.role}</span>
                                                    <p className="text-[11px] font-mono text-gray-400">{m.mail}</p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold">
                                                    {m.badge}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* 3. DEDICATED SOCIAL STUDIO SPOTLIGHT & PHOTO GALLERY */}
                    <div id="social-studio" className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-purple-950/30 via-[#0b0d14] to-neon-red/10 border border-purple-500/30 space-y-10 shadow-[0_0_80px_rgba(168,85,247,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[150px] pointer-events-none rounded-full" />
                        
                        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-6 border-b border-white/10 relative z-10">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest border border-purple-500/40">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    FONCTIONNALITÉ STAR WEBSIDERS
                                </div>
                                <h2 className="text-3xl sm:text-5xl font-display font-black text-white italic tracking-tight uppercase">
                                    Le Social Studio Dropsiders en Action
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                                    Voici les véritables créations générées par notre Social Studio. Chaque article, line-up ou annonce publié sur votre site peut être transformé en story Instagram HD ou post réseaux sociaux en un instant.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => scrollToForm('Média, Web Radio & Streaming', '1 500 € – 3 000 €')}
                                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-neon-red text-white font-black uppercase tracking-wider text-xs hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all cursor-pointer flex items-center gap-2 shrink-0"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Intégrer ce studio sur mon site</span>
                                </button>
                            </div>
                        </div>

                        {/* High-Impact Photos Showcase Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                            {socialStudioPhotos.map((photo, idx) => (
                                <motion.div 
                                    key={idx}
                                    whileHover={{ y: -6 }}
                                    onClick={() => setPreviewImage({ src: photo.src, title: photo.title, subtitle: photo.format })}
                                    className="group rounded-2xl overflow-hidden bg-black/60 border border-white/10 hover:border-purple-400/60 transition-all cursor-pointer shadow-xl flex flex-col justify-between"
                                >
                                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/80">
                                        <img 
                                            src={photo.src} 
                                            alt={photo.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                                                {photo.format}
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="p-3 rounded-full bg-purple-600/90 text-white shadow-lg">
                                                <Maximize2 className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-5 space-y-2 border-t border-white/5 bg-[#0e1017]">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-base font-bold text-white uppercase group-hover:text-purple-300 transition-colors">
                                                {photo.title}
                                            </h4>
                                            <Instagram className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors shrink-0" />
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            {photo.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Advantages Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 relative z-10">
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                                <Palette className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-xs font-bold text-white uppercase">26 Palettes Automatiques</h5>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Couleurs et dégradés intelligents adaptés à votre sujet</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                                <Smartphone className="w-5 h-5 text-neon-cyan shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-xs font-bold text-white uppercase">Mise en scène 3D Photoréaliste</h5>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Rendus de smartphones 3D pour des stories percutantes</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                                <Zap className="w-5 h-5 text-neon-red shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-xs font-bold text-white uppercase">Export Express PNG & MP4</h5>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Génération locale instantanée sans temps d'attente</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. CASE STUDY & ESTIMATION BANNER */}
                    <div id="estimation" className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white/[0.04] via-black/80 to-white/[0.02] border border-white/10 space-y-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-8 border-b border-white/10">
                            <div className="space-y-3 text-center lg:text-left">
                                <span className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.3em]">
                                    DES TARIFS JUSTES & UNE VITESSE ÉCLAIR
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-display font-black text-white italic tracking-tight uppercase">
                                    Des sites de 200 € à 5 000 € maximum
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
                                    Là où une agence traditionnelle facture entre 5 000 € et 25 000 € avec des mois d'attente, Websiders vous livre une plateforme sur-mesure ultra-rapide avec un engagement de livraison ferme.
                                </p>
                            </div>
                            
                            {/* Livraision Express Banner */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-red/10 border border-neon-cyan/40 text-center shrink-0 min-w-[260px] shadow-[0_0_30px_rgba(0,255,213,0.15)]">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-widest mb-1.5">
                                    ⚡ RAPIDITÉ RECORD
                                </div>
                                <div className="text-3xl sm:text-4xl font-display font-black text-white italic tracking-tight">
                                    SOUS 1 SEMAINE
                                </div>
                                <div className="text-[11px] text-neon-cyan font-bold uppercase tracking-wider mt-1">
                                    Livraison Clé en Main Maximum
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    De 200 € à 5 000 € · Prêt à l'emploi
                                </p>
                            </div>
                        </div>

                        {/* Quick Comparison Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">VS</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Agence Web Classique</h4>
                                        <p className="text-[10px] text-gray-400">Délais à rallonge (2 à 4 mois), CMS lourd, prix exorbitants</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 text-xs text-gray-400">
                                    <li className="flex items-start gap-2">❌ Délais de 2 à 4 mois pour un simple site</li>
                                    <li className="flex items-start gap-2">❌ Devis gonflés (5 000 € à plus de 20 000 €)</li>
                                    <li className="flex items-start gap-2">❌ Temps de chargement lent (2 à 4 secondes)</li>
                                    <li className="flex items-start gap-2">❌ Pas de studio pour créer les visuels des réseaux</li>
                                    <li className="flex items-start gap-2">❌ Radio qui coupe dès qu'on change de page</li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">⚡</span>
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">L'Engagement Websiders</h4>
                                        <p className="text-[10px] text-gray-400">React 19, Cloudflare Edge Workers, PWA & Social Studio</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 text-xs text-gray-300">
                                    <li className="flex items-start gap-2 text-emerald-400">✓ Livraison garantie sous 1 semaine maximum</li>
                                    <li className="flex items-start gap-2 text-emerald-400">✓ Tarifs ultra-compétitifs de 200 € à 5 000 € max</li>
                                    <li className="flex items-start gap-2 text-emerald-400">✓ Social Studio intégré pour générer vos stories en 1 clic</li>
                                    <li className="flex items-start gap-2 text-emerald-400">✓ Vitesse instantanée : chargement sous 0.5s</li>
                                    <li className="flex items-start gap-2 text-emerald-400">✓ Radio persistante & lecteurs streaming continus</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 5. LES 6 PILIERS TECHNIQUES */}
                    <div id="piliers" className="space-y-10">
                        <div className="text-center space-y-3">
                            <span className="text-[10px] font-black text-neon-red uppercase tracking-[0.3em]">
                                ANATOMIE TECHNIQUE
                            </span>
                            <h3 className="text-2xl sm:text-4xl font-display font-black text-white italic tracking-tight uppercase">
                                Les 6 Piliers d'un Site d'Élite
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                                Chaque brique a été conçue sur mesure pour offrir le maximum de puissance et d'autonomie à votre projet.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {architecturePillars.map((pillar, idx) => (
                                <motion.div 
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="p-7 rounded-2xl bg-white/[0.025] border border-white/10 hover:border-neon-cyan/40 hover:bg-white/[0.04] transition-all space-y-4 group relative flex flex-col justify-between"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                {pillar.icon}
                                            </div>
                                            <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                                                {pillar.badge}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-display font-black text-white italic tracking-tight uppercase group-hover:text-neon-cyan transition-colors">
                                                {pillar.title}
                                            </h4>
                                            <p className="text-[11px] font-mono text-neon-cyan/80 mt-0.5">
                                                {pillar.valueAgency}
                                            </p>
                                        </div>
                                        <ul className="space-y-2 pt-2 border-t border-white/5">
                                            {pillar.points.map((pt, pIdx) => (
                                                <li key={pIdx} className="text-xs text-gray-400 flex items-start gap-2 leading-relaxed">
                                                    <span className="text-neon-red font-bold shrink-0">›</span>
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 6. FORMULES & TARIFS (200€ à 5 000€) */}
                    <div id="tarifs" className="space-y-10">
                        <div className="text-center space-y-3">
                            <span className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.3em]">
                                OFFRES CLÉS EN MAIN
                            </span>
                            <h3 className="text-2xl sm:text-4xl font-display font-black text-white italic tracking-tight uppercase">
                                Nos Formules de Création
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                                Des tarifs accessibles allant de 200 € à 5 000 € maximum, avec livraison garantie sous 1 semaine.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                            {pricingPlans.map((plan, i) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -6 }}
                                    className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 relative backdrop-blur-xl ${plan.color}`}
                                >
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-white/10 text-white">
                                                {plan.badge}
                                            </span>
                                            {plan.featured && (
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-neon-red/30 text-neon-red border border-neon-red/40">
                                                    Recommandé
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-display font-black italic tracking-tight uppercase text-white">
                                                {plan.name}
                                            </h4>
                                            <div className="text-3xl sm:text-4xl font-display font-black italic text-neon-cyan mt-1">
                                                {plan.price}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                                {plan.desc}
                                            </p>
                                        </div>
                                        <ul className="space-y-2.5 pt-4 border-t border-white/5">
                                            {plan.features.map((feat, fI) => (
                                                <li key={fI} className="text-xs text-gray-300 flex items-start gap-2.5">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button 
                                        type="button"
                                        onClick={() => scrollToForm(plan.projectTypeValue, plan.budgetValue)}
                                        className={`w-full py-3.5 rounded-xl text-center font-black uppercase tracking-wider text-xs transition-all cursor-pointer ${plan.btnColor}`}
                                    >
                                        {plan.btnText}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 7. DEDICATED WEBSIDERS ESTIMATE FORM */}
                    <div ref={formRef} id="formulaire-devis" className="pt-6">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-neon-red/15 via-[#0e1017] to-neon-cyan/15 border border-white/15 relative overflow-hidden shadow-[0_0_80px_rgba(0,255,213,0.15)]"
                        >
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="text-center space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan mx-auto shadow-[0_0_20px_rgba(0,255,213,0.3)]">
                                        <Mail className="w-7 h-7" />
                                    </div>
                                    <span className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.3em] block">
                                        CONTACT DIRECT & DEVIS SUR-MESURE
                                    </span>
                                    <h3 className="text-3xl sm:text-5xl font-display font-black text-white uppercase italic tracking-tight">
                                        Démarrer Votre Projet
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                                        Remplissez ce formulaire pour recevoir une proposition adaptée à votre budget (de 200 € à 5 000 €). Réponse garantie sous 24h ouvrées.
                                    </p>
                                </div>

                                <AnimatePresence mode="wait">
                                    {isSuccess ? (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                                <Check className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-xl font-display font-black uppercase text-emerald-400 italic">
                                                Demande de projet envoyée avec succès !
                                            </h4>
                                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
                                                Merci pour votre confiance. Votre demande a bien été reçue par notre équipe sur <strong>alex@dropsiders.fr</strong> et nous préparons une première proposition pour vous recontacter très rapidement.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setIsSuccess(false)}
                                                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                                            >
                                                Envoyer une autre demande
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Type de site selector */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    Type de site recherché
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {projectTypes.map((pt) => (
                                                        <button
                                                            key={pt}
                                                            type="button"
                                                            onClick={() => setProjectType(pt)}
                                                            className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                                                                projectType === pt
                                                                    ? 'bg-neon-cyan/20 border-neon-cyan text-white shadow-[0_0_15px_rgba(0,255,213,0.3)]'
                                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                                            }`}
                                                        >
                                                            {pt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Budget selector (200€ à 5 000€) */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    Budget envisagé (200 € à 5 000 €)
                                                </label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {budgetOptions.map((b) => (
                                                        <button
                                                            key={b}
                                                            type="button"
                                                            onClick={() => setBudget(b)}
                                                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                                                                budget === b
                                                                    ? 'bg-neon-red/20 border-neon-red text-white shadow-[0_0_15px_rgba(255,17,17,0.3)]'
                                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                                            }`}
                                                        >
                                                            {b}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Name & Email Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        Nom complet / Entreprise *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="ex: Alex Dupont (Studio 8)"
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        Adresse Email *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="ex: contact@exemple.com"
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Phone & Timeline Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        Numéro de Téléphone (Optionnel)
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        placeholder="ex: +33 6 12 34 56 78"
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan transition-all"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                        Délai de réalisation souhaité
                                                    </label>
                                                    <select
                                                        value={timeline}
                                                        onChange={(e) => setTimeline(e.target.value)}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-neon-cyan transition-all cursor-pointer"
                                                    >
                                                        {timelineOptions.map((t) => (
                                                            <option key={t} value={t} className="bg-[#0e1017] text-white">
                                                                {t}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Description Textarea */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    Description de votre projet & besoins clés *
                                                </label>
                                                <textarea
                                                    required
                                                    rows={4}
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Décrivez votre activité, vos objectifs, les fonctionnalités souhaitées ou ajoutez des liens vers des sites qui vous inspirent..."
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan transition-all resize-none"
                                                />
                                            </div>

                                            {errorMessage && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                                                    {errorMessage}
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-600 text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(0,255,213,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span>Envoi de votre demande en cours...</span>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        <span>Transmettre ma demande de devis (alex@dropsiders.fr)</span>
                                                    </>
                                                )}
                                            </button>

                                            <p className="text-[10px] text-gray-500 text-center">
                                                🔒 Vos données restent confidentielles et ne seront jamais partagées. Réponse sous 24h ouvrées.
                                            </p>
                                        </form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* ─── LIGHTBOX MODAL FOR PREVIEWS ─── */}
            <AnimatePresence>
                {previewImage && (
                    <div 
                        className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-4xl max-h-[90vh] bg-[#0c0e15] border border-white/20 rounded-3xl overflow-hidden flex flex-col p-4 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                                <div>
                                    <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-widest">
                                        {previewImage.subtitle}
                                    </span>
                                    <h4 className="text-base font-bold text-white uppercase">{previewImage.title}</h4>
                                </div>
                                <button 
                                    onClick={() => setPreviewImage(null)}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-auto flex items-center justify-center p-2 max-h-[75vh]">
                                <img 
                                    src={previewImage.src} 
                                    alt={previewImage.title}
                                    className="max-h-[70vh] w-auto object-contain rounded-xl border border-white/10 shadow-2xl"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── DEDICATED WEBSIDERS FOOTER ─── */}
            <footer className="border-t border-white/10 bg-[#050608] px-4 sm:px-8 py-8 text-center text-xs text-gray-500 space-y-3">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider">
                        © {new Date().getFullYear()} <strong className="text-white">WEBSIDERS FR</strong> · Solution de création de sites web
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5 justify-center">
                        Une réalisation propulsée par l'expertise <span className="text-neon-red font-bold">Dropsiders.fr</span>
                    </p>
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider">
                        <Link to="/" className="text-gray-400 hover:text-white transition-colors">Retour Dropsiders</Link>
                        <Link to="/mentions-legales" className="text-gray-400 hover:text-white transition-colors">Mentions Légales</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
