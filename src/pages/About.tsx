import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '../components/ui/Badge';
import { Globe, Users, Zap, ShieldCheck } from 'lucide-react';

export function About() {
    const { language } = useLanguage();

    const content = {
        fr: {
            title: "À PROPOS DE",
            subtitle: "DROPSIDERS",
            intro: "Dropsiders est bien plus qu'un simple site d'actualité. C'est le cœur battant de la communauté Harddance et des festivals en Europe.",
            mission_title: "Notre Mission",
            mission_desc: "Fondé par des passionnés pour des passionnés, Dropsiders s'est donné pour mission de connecter les fans de musique électronique avec les événements qui marquent leur vie. Nous croyons que chaque festival est une expérience unique qui mérite d'être documentée, partagée et célébrée.",
            values_title: "Nos Valeurs",
            values: [
                { icon: <Zap className="w-6 h-6" />, title: "Réactivité", desc: "Soyez les premiers informés des line-ups, des mises en vente et des changements de dernière minute." },
                { icon: <Users className="w-6 h-6" />, title: "Communauté", desc: "Nous mettons en avant les fans, les photographes et les créateurs qui font vivre la scène." },
                { icon: <Globe className="w-6 h-6" />, title: "Indépendance", desc: "Notre regard est authentique. Nous partageons nos retours d'expérience en toute transparence." },
                { icon: <ShieldCheck className="w-6 h-6" />, title: "Fiabilité", desc: "Toutes nos informations sont vérifiées auprès des organisateurs officiels." }
            ],
            history_title: "L'Histoire de Dropsiders",
            history_desc: "Dropsiders est né d'un constat simple : il manquait un média centralisé et moderne pour suivre l'actualité foisonnante des festivals Hardstyle et Techno. Depuis nos débuts, nous avons parcouru des milliers de kilomètres, assisté à des centaines d'heures de sets et capturé des moments inoubliables pour les partager avec vous.",
            commitment_title: "Notre engagement envers vous",
            commitment_desc: "Que vous soyez un vétéran des festivals ou que vous prépariez votre premier voyage, Dropsiders est là pour vous guider. De l'agenda mondial à l'organisation de vos déplacements (bus, vols), nous simplifions votre accès à la musique."
        },
        en: {
            title: "ABOUT",
            subtitle: "DROPSIDERS",
            intro: "Dropsiders is more than just a news site. It is the beating heart of the Harddance and festival community in Europe.",
            mission_title: "Our Mission",
            mission_desc: "Founded by fans for fans, Dropsiders is on a mission to connect electronic music lovers with the events that define their lives. We believe every festival is a unique experience that deserves to be documented, shared, and celebrated.",
            values_title: "Our Values",
            values: [
                { icon: <Zap className="w-6 h-6" />, title: "Reactivity", desc: "Be the first to know about line-ups, ticket sales, and last-minute changes." },
                { icon: <Users className="w-6 h-6" />, title: "Community", desc: "We highlight the fans, photographers, and creators who bring the scene to life." },
                { icon: <Globe className="w-6 h-6" />, title: "Independence", desc: "Our perspective is authentic. We share our feedback with full transparency." },
                { icon: <ShieldCheck className="w-6 h-6" />, title: "Reliability", desc: "All our information is verified with official organizers." }
            ],
            history_title: "The Dropsiders Story",
            history_desc: "Dropsiders was born from a simple observation: a centralized and modern media platform was missing to follow the thriving Hardstyle and Techno festival scene. Since our beginnings, we've traveled thousands of miles, attended hundreds of hours of sets, and captured unforgettable moments to share with you.",
            commitment_title: "Our Commitment to You",
            commitment_desc: "Whether you're a festival veteran or planning your first trip, Dropsiders is here to guide you. From the global agenda to organizing your travels (bus, flights), we simplify your access to music."
        }
    };

    const t = language === 'en' ? content.en : content.fr;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <div className="max-w-5xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-16"
                >
                    <header className="text-center space-y-4">
                        <Badge color="red">Publisher Content</Badge>
                        <h1 className="text-5xl md:text-8xl font-display font-black uppercase italic tracking-tighter">
                            {t.title} <span className="text-neon-red">{t.subtitle}</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                            {t.intro}
                        </p>
                    </header>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-display font-black uppercase italic border-l-4 border-neon-red pl-6">{t.mission_title}</h2>
                            <p className="text-gray-400 leading-relaxed text-lg">
                                {t.mission_desc}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {t.values.map((v, i) => (
                                <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-neon-red/50 transition-colors">
                                    <div className="text-neon-red mb-3">{v.icon}</div>
                                    <h4 className="font-bold uppercase text-xs mb-2 tracking-widest">{v.title}</h4>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="p-12 bg-white/5 border border-white/10 rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-red/10 blur-[100px] pointer-events-none" />
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl font-display font-black uppercase italic">{t.history_title}</h2>
                            <p className="text-gray-400 leading-relaxed text-lg">
                                {t.history_desc}
                            </p>
                        </div>
                    </section>

                    <section className="text-center space-y-8 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-display font-black uppercase italic">{t.commitment_title}</h2>
                        <p className="text-gray-400 leading-relaxed text-lg">
                            {t.commitment_desc}
                        </p>
                        <div className="pt-8 flex justify-center gap-8">
                            <div className="text-center">
                                <div className="text-4xl font-display font-black text-neon-red">50k+</div>
                                <div className="text-[10px] font-black uppercase text-gray-500 mt-2">Visiteurs Mensuels</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-display font-black text-white">500+</div>
                                <div className="text-[10px] font-black uppercase text-gray-500 mt-2">Festivals Répertoriés</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-display font-black text-white">100%</div>
                                <div className="text-[10px] font-black uppercase text-gray-500 mt-2">Passion Hardstyle</div>
                            </div>
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
