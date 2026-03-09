import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function PrivacyPolicy() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-neon-red/10 border border-neon-red/20 rounded-2xl">
                            <Shield className="w-8 h-8 text-neon-red" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase">
                            PRIVACY <span className="text-neon-red">POLICY</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm italic">
                        Last updated: February 16, 01061988
                    </p>
                </motion.div>

                <div className="space-y-8 text-gray-300">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-neon-red" />
                            <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                        </div>
                        <p className="leading-relaxed">
                            Welcome to dropsiders.fr. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy informs you about how we process your personal data when you visit our website
                            and informs you of your privacy rights.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-6 h-6 text-neon-red" />
                            <h2 className="text-2xl font-bold text-white">2. Data We Collect</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Usage Data</h3>
                                <p className="leading-relaxed">
                                    We automatically collect certain information when you visit our site, including:
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                    <li>IP address</li>
                                    <li>Browser type and version</li>
                                    <li>Pages visited and time spent on each page</li>
                                    <li>Date and time of your visit</li>
                                    <li>Device used (computer, mobile, tablet)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Data You Provide to Us</h3>
                                <p className="leading-relaxed">
                                    If you subscribe to our newsletter or contact us, we collect:
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                    <li>First and last name</li>
                                    <li>Email address</li>
                                    <li>Any message or content you send to us</li>
                                </ul>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-neon-red" />
                            <h2 className="text-2xl font-bold text-white">3. How We Use Your Data</h2>
                        </div>
                        <p className="leading-relaxed mb-3">
                            We use your personal data to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Provide and maintain our service</li>
                            <li>Send you our newsletter (if you are subscribed)</li>
                            <li>Improve our website and your user experience</li>
                            <li>Analyze site usage to optimize our content</li>
                            <li>Respond to your requests and questions</li>
                            <li>Detect and prevent fraud or abuse</li>
                        </ul>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
                        <p className="leading-relaxed mb-3">
                            We never sell your personal data. We may share your information with:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong className="text-white">Service Providers:</strong> For hosting, analysis, and email delivery</li>
                            <li><strong className="text-white">Legal Obligations:</strong> If required by law or to protect our rights</li>
                            <li><strong className="text-white">Social Networks:</strong> If you interact with our content on social networks</li>
                        </ul>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
                        <p className="leading-relaxed mb-3">
                            In accordance with GDPR, you have the following rights:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong className="text-white">Right of Access:</strong> Obtain a copy of your personal data</li>
                            <li><strong className="text-white">Right of Rectification:</strong> Correct your inaccurate data</li>
                            <li><strong className="text-white">Right to Erasure:</strong> Request the deletion of your data</li>
                            <li><strong className="text-white">Right to Object:</strong> Object to the processing of your data</li>
                            <li><strong className="text-white">Right to Portability:</strong> Receive your data in a structured format</li>
                        </ul>
                        <p className="mt-4 leading-relaxed">
                            To exercise these rights, contact us at: <a href="mailto:contact@dropsiders.fr" className="text-neon-red hover:underline">contact@dropsiders.fr</a>
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">6. Data Security</h2>
                        <p className="leading-relaxed">
                            We implement appropriate technical and organizational security measures to protect your data against
                            unauthorized access, modification, disclosure, or destruction. However, no method of transmission over the Internet
                            is completely secure.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
                        <p className="leading-relaxed">
                            We retain your personal data only for the period necessary for the purposes for which it was collected,
                            unless a longer retention period is required or permitted by law.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-neon-red/10 border border-neon-red/20 rounded-2xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-neon-red" />
                            <h2 className="text-2xl font-bold text-white">8. Contact Us</h2>
                        </div>
                        <p className="leading-relaxed">
                            For any questions regarding this privacy policy or your personal data, contact us:
                        </p>
                        <div className="mt-4 space-y-2">
                            <p><strong className="text-white">Email:</strong> <a href="mailto:contact@dropsiders.fr" className="text-neon-red hover:underline">contact@dropsiders.fr</a></p>
                            <p><strong className="text-white">Website:</strong> <a href="https://www.dropsiders.fr" className="text-neon-red hover:underline">www.dropsiders.fr</a></p>
                        </div>
                    </motion.section>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-6 lg:px-12 xl:px-16 2xl:px-24 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-neon-red/10 border border-neon-red/20 rounded-2xl">
                        <Shield className="w-8 h-8 text-neon-red" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
                        POLITIQUE DE CONFIDENTIALITÉ
                    </h1>
                </div>
                <p className="text-gray-400 text-sm">
                    Dernière mise à jour : 16 février 01061988
                </p>
            </motion.div>

            <div className="space-y-8 text-gray-300">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Eye className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                    </div>
                    <p className="leading-relaxed">
                        Bienvenue sur dropsiders.fr. Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles.
                        Cette politique de confidentialité vous informe sur la manière dont nous traitons vos données personnelles lorsque vous visitez notre site web
                        et vous informe de vos droits en matière de confidentialité.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">2. Données que nous collectons</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Données d'utilisation</h3>
                            <p className="leading-relaxed">
                                Nous collectons automatiquement certaines informations lorsque vous visitez notre site, notamment :
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                <li>Adresse IP</li>
                                <li>Type de navigateur et version</li>
                                <li>Pages visitées et temps passé sur chaque page</li>
                                <li>Date et heure de votre visite</li>
                                <li>Appareil utilisé (ordinateur, mobile, tablette)</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Données que vous nous fournissez</h3>
                            <p className="leading-relaxed">
                                Si vous vous inscrivez à notre newsletter ou nous contactez, nous collectons :
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                                <li>Nom et prénom</li>
                                <li>Adresse e-mail</li>
                                <li>Tout message ou contenu que vous nous envoyez</li>
                            </ul>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">3. Comment nous utilisons vos données</h2>
                    </div>
                    <p className="leading-relaxed mb-3">
                        Nous utilisons vos données personnelles pour :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Fournir et maintenir notre service</li>
                        <li>Vous envoyer notre newsletter (si vous y êtes inscrit)</li>
                        <li>Améliorer notre site web et votre expérience utilisateur</li>
                        <li>Analyser l'utilisation de notre site pour optimiser notre contenu</li>
                        <li>Répondre à vos demandes et questions</li>
                        <li>Détecter et prévenir les fraudes ou abus</li>
                    </ul>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">4. Partage de vos données</h2>
                    <p className="leading-relaxed mb-3">
                        Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong className="text-white">Prestataires de services :</strong> Pour l'hébergement, l'analyse et l'envoi d'e-mails</li>
                        <li><strong className="text-white">Obligations légales :</strong> Si la loi l'exige ou pour protéger nos droits</li>
                        <li><strong className="text-white">Réseaux sociaux :</strong> Si vous interagissez avec nos contenus sur les réseaux sociaux</li>
                    </ul>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">5. Vos droits</h2>
                    <p className="leading-relaxed mb-3">
                        Conformément au RGPD, vous disposez des droits suivants :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong className="text-white">Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                        <li><strong className="text-white">Droit de rectification :</strong> Corriger vos données inexactes</li>
                        <li><strong className="text-white">Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                        <li><strong className="text-white">Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
                        <li><strong className="text-white">Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
                    </ul>
                    <p className="mt-4 leading-relaxed">
                        Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@dropsiders.fr" className="text-neon-red hover:underline">contact@dropsiders.fr</a>
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">6. Sécurité des données</h2>
                    <p className="leading-relaxed">
                        Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre
                        tout accès non autorisé, modification, divulgation ou destruction. Cependant, aucune méthode de transmission sur Internet
                        n'est totalement sécurisée.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">7. Conservation des données</h2>
                    <p className="leading-relaxed">
                        Nous conservons vos données personnelles uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées,
                        sauf si une période de conservation plus longue est requise ou autorisée par la loi.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-neon-red/10 border border-neon-red/20 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Mail className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">8. Nous contacter</h2>
                    </div>
                    <p className="leading-relaxed">
                        Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous :
                    </p>
                    <div className="mt-4 space-y-2">
                        <p><strong className="text-white">Email :</strong> <a href="mailto:contact@dropsiders.fr" className="text-neon-red hover:underline">contact@dropsiders.fr</a></p>
                        <p><strong className="text-white">Site web :</strong> <a href="https://www.dropsiders.fr" className="text-neon-red hover:underline">www.dropsiders.fr</a></p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
