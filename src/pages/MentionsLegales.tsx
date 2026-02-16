import { motion } from 'framer-motion';

export function MentionsLegales() {
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
                        En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site internet <span className="text-white">https://dropsiders.eu</span> l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :
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
                        DROPSIDERS : L'actu de tous les festivals ne pourra être tenu pour responsable des dommages directs et indirects causés au matériel de l’utilisateur, lors de l’accès au site https://dropsiders.eu.
                    </p>
                </section>

                <section className="space-y-6 pb-20">
                    <h2 className="text-xl font-display font-black text-white uppercase italic tracking-tight border-l-4 border-neon-red pl-4">
                        5. DROIT APPLICABLE ET ATTRIBUTION DE JURIDICTION
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                        Tout litige en relation avec l’utilisation du site https://dropsiders.eu est soumis au droit français. En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents.
                    </p>
                </section>
            </motion.div>
        </div>
    );
}
