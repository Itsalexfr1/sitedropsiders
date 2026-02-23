import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export function MentionsLegales() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <div className="max-w-4xl mx-auto px-6 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <div>
                        <h1 className="text-4xl md:text-5xl font-display font-black text-white italic tracking-tighter uppercase mb-8">
                            LEGAL <span className="text-neon-red">NOTICE</span>
                        </h1>
                        <p className="text-gray-400 leading-relaxed italic">
                            In force as of 02/16/2026
                        </p>
                    </div>

                    <section className="space-y-6">
                        <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                            1. SITE EDITION
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            Under Article 6 of Law No. 2004-575 of June 21, 2004 for confidence in the digital economy, users of the website <span className="text-white">https://dropsiders.fr</span> are informed of the identity of the various parties involved in its creation and monitoring:
                        </p>
                        <ul className="text-gray-400 space-y-2 list-disc pl-6">
                            <li><strong className="text-white">Site Owner:</strong> DROPSIDERS: All festival news</li>
                            <li><strong className="text-white">Contact:</strong> contact@dropsiders.fr</li>
                            <li><strong className="text-white">Publication Director:</strong> Dropsiders Team</li>
                        </ul>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                            2. HOSTING
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            The Site is hosted by <strong className="text-white">Vercel Inc.</strong>, located at 340 S Lemon Ave #4133 Walnut, CA 91789, USA.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                            3. INTELLECTUAL PROPERTY AND COUNTERFEITING
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            DROPSIDERS: All festival news owns the intellectual property rights or holds the usage rights for all elements accessible on the website, including text, images, graphics, logos, videos, architecture, icons, and sounds.
                        </p>
                        <p className="text-gray-400 leading-relaxed">
                            Any reproduction, representation, modification, publication, adaptation of all or part of the site's elements, regardless of the medium or process used, is prohibited without prior written authorization from DROPSIDERS: All festival news.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                            4. LIMITATIONS OF LIABILITY
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            DROPSIDERS: All festival news shall not be held liable for direct or indirect damage caused to the user's equipment when accessing the site https://dropsiders.fr.
                        </p>
                    </section>

                    <section className="space-y-6 pb-20">
                        <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                            5. APPLICABLE LAW AND JURISDICTION
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            Any dispute relating to the use of the site https://dropsiders.fr is subject to French law. Except in cases where the law does not allow it, exclusive jurisdiction is granted to the competent courts.
                        </p>
                    </section>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white italic tracking-tighter uppercase mb-8">
                        MENTIONS <span className="text-neon-red">LÉGALES</span>
                    </h1>
                    <p className="text-gray-400 leading-relaxed italic">
                        En vigueur au 16/02/2026
                    </p>
                </div>

                <section className="space-y-6">
                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                        1. ÉDITION DU SITE
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site internet <span className="text-white">https://dropsiders.fr</span> l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :
                    </p>
                    <ul className="text-gray-400 space-y-2 list-disc pl-6">
                        <li><strong className="text-white">Propriétaire du site :</strong> DROPSIDERS : L'actu de tous les festivals</li>
                        <li><strong className="text-white">Contact :</strong> contact@dropsiders.fr</li>
                        <li><strong className="text-white">Directeur de la publication :</strong> Équipe Dropsiders</li>
                    </ul>
                </section>

                <section className="space-y-6">
                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                        2. HÉBERGEMENT
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        Le Site est hébergé par la société <strong className="text-white">Vercel Inc.</strong>, situé au 340 S Lemon Ave #4133 Walnut, CA 91789, États-Unis.
                    </p>
                </section>

                <section className="space-y-6">
                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                        3. PROPRIÉTÉ INTELLECTUELLE ET CONTREFAÇONS
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        DROPSIDERS : L'actu de tous les festivals est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous les éléments accessibles sur le site internet, notamment les textes, images, graphismes, logos, vidéos, architecture, icônes et sons.
                    </p>
                    <p className="text-gray-400 leading-relaxed">
                        Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de DROPSIDERS : L'actu de tous les festivals.
                    </p>
                </section>

                <section className="space-y-6">
                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                        4. LIMITATIONS DE RESPONSABILITÉ
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        DROPSIDERS : L'actu de tous les festivals ne pourra être tenu pour responsable des dommages directs et indirects causés au matériel de l’utilisateur, lors de l’accès au site https://dropsiders.fr.
                    </p>
                </section>

                <section className="space-y-6 pb-20">
                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                        5. DROIT APPLICABLE ET ATTRIBUTION DE JURIDICTION
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        Tout litige en relation avec l’utilisation du site https://dropsiders.fr est soumis au droit français. En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents.
                    </p>
                </section>
            </motion.div>
        </div>
    );
}
