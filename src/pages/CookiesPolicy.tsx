import { motion } from 'framer-motion';
import { Cookie, Settings, BarChart3, Target, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function CookiesPolicy() {
    const { language } = useLanguage();

    if (language === 'en') {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-neon-red/10 border border-neon-red/20 rounded-2xl">
                            <Cookie className="w-8 h-8 text-neon-red" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase">
                            COOKIES <span className="text-neon-red">POLICY</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm italic">
                        Last updated: February 16, 2026
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
                            <Cookie className="w-6 h-6 text-neon-red" />
                            <h2 className="text-2xl font-bold text-white">1. What is a Cookie?</h2>
                        </div>
                        <p className="leading-relaxed mb-3">
                            A cookie is a small text file stored on your device (computer, tablet, or mobile) when you visit a website.
                            Cookies allow the site to remember your actions and preferences (such as language, font size, and other display preferences)
                            for a given period, so you don't have to re-enter them every time you return to the site or navigate from one page to another.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">2. How do we use cookies?</h2>
                        <p className="leading-relaxed mb-4">
                            Dropsiders.eu uses cookies to improve your browsing experience and to analyze the use of our site.
                            Here are the different types of cookies we use:
                        </p>

                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <h3 className="text-xl font-semibold text-white">Strictly Necessary Cookies</h3>
                                </div>
                                <p className="leading-relaxed mb-2">
                                    These cookies are essential for the site to function. They allow you to navigate the site and use its features.
                                </p>
                                <div className="mt-3 text-sm">
                                    <p className="text-gray-400"><strong className="text-white">Duration:</strong> Session</p>
                                    <p className="text-gray-400"><strong className="text-white">Examples:</strong> Session cookies, security cookies</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-xl font-semibold text-white">Analytical Cookies</h3>
                                </div>
                                <p className="leading-relaxed mb-2">
                                    These cookies allow us to understand how visitors use our site by collecting information anonymously.
                                    This helps us improve the way the site functions.
                                </p>
                                <div className="mt-3 text-sm">
                                    <p className="text-gray-400"><strong className="text-white">Duration:</strong> Up to 2 years</p>
                                    <p className="text-gray-400"><strong className="text-white">Examples:</strong> Google Analytics, visit statistics</p>
                                    <p className="text-gray-400"><strong className="text-white">Data collected:</strong> Pages visited, visit duration, traffic source</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Settings className="w-5 h-5 text-purple-500" />
                                    <h3 className="text-xl font-semibold text-white">Functional Cookies</h3>
                                </div>
                                <p className="leading-relaxed mb-2">
                                    These cookies allow the site to remember your choices (such as your username, language, or region)
                                    and provide enhanced and more personalized features.
                                </p>
                                <div className="mt-3 text-sm">
                                    <p className="text-gray-400"><strong className="text-white">Duration:</strong> Up to 1 year</p>
                                    <p className="text-gray-400"><strong className="text-white">Examples:</strong> Language preferences, display preferences</p>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <Target className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-xl font-semibold text-white">Social Media Cookies</h3>
                                </div>
                                <p className="leading-relaxed mb-2">
                                    These cookies are used to allow you to share content on social networks like Facebook, Instagram,
                                    Twitter, and YouTube. These cookies are controlled by the respective social networks.
                                </p>
                                <div className="mt-3 text-sm">
                                    <p className="text-gray-400"><strong className="text-white">Duration:</strong> Variable depending on the social network</p>
                                    <p className="text-gray-400"><strong className="text-white">Examples:</strong> Share buttons, social widgets</p>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">3. Third-Party Cookies</h2>
                        <p className="leading-relaxed mb-4">
                            Some cookies on our site are placed by third-party services. We use the following services:
                        </p>
                        <div className="space-y-3">
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-semibold text-white mb-1">Google Analytics</h4>
                                <p className="text-sm leading-relaxed">
                                    To analyze site usage and improve our services.
                                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline ml-1">
                                        Google Privacy Policy
                                    </a>
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-semibold text-white mb-1">Social Networks</h4>
                                <p className="text-sm leading-relaxed">
                                    Facebook, Instagram, TikTok, YouTube, and Twitter may place cookies when you interact with their widgets on our site.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <h4 className="font-semibold text-white mb-1">Spotify</h4>
                                <p className="text-sm leading-relaxed">
                                    To display our embedded playlists.
                                    <a href="https://www.spotify.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline ml-1">
                                        Spotify Privacy Policy
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="w-6 h-6 text-neon-red" />
                            <h2 className="text-2xl font-bold text-white">4. How to manage cookies?</h2>
                        </div>
                        <p className="leading-relaxed mb-4">
                            You can control and/or delete cookies as you wish. You can delete all cookies already present
                            on your computer and set most browsers to block them.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Browser Settings</h3>
                                <p className="leading-relaxed mb-2">
                                    You can manage cookies via your browser settings:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                                    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Google Chrome</a></li>
                                    <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Mozilla Firefox</a></li>
                                    <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Safari</a></li>
                                    <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Microsoft Edge</a></li>
                                </ul>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                <p className="text-sm leading-relaxed">
                                    <strong className="text-yellow-500">⚠️ Note:</strong> If you block all cookies, some features of the site
                                    may not function correctly. For example, you may have to re-enter your preferences each visit.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">5. Cookies and Personal Data</h2>
                        <p className="leading-relaxed">
                            Information collected via cookies may include personal data. This data is processed in accordance
                            with our <a href="/politique-de-confidentialite" className="text-neon-red hover:underline">Privacy Policy</a>.
                            We never sell your data to third parties.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">6. Changes to this Policy</h2>
                        <p className="leading-relaxed">
                            We may update this cookie policy from time to time to reflect changes in our practices
                            or for other operational, legal, or regulatory reasons. We encourage you to check this page regularly.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">7. Summary Table of Cookies</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-white font-semibold">Cookie Name</th>
                                        <th className="text-left py-3 px-4 text-white font-semibold">Type</th>
                                        <th className="text-left py-3 px-4 text-white font-semibold">Duration</th>
                                        <th className="text-left py-3 px-4 text-white font-semibold">Purpose</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-white/5">
                                        <td className="py-3 px-4">session_id</td>
                                        <td className="py-3 px-4">Necessary</td>
                                        <td className="py-3 px-4">Session</td>
                                        <td className="py-3 px-4">User session management</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-3 px-4">_ga</td>
                                        <td className="py-3 px-4">Analytical</td>
                                        <td className="py-3 px-4">2 years</td>
                                        <td className="py-3 px-4">Google Analytics - User distinction</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-3 px-4">_gid</td>
                                        <td className="py-3 px-4">Analytical</td>
                                        <td className="py-3 px-4">24 hours</td>
                                        <td className="py-3 px-4">Google Analytics - User distinction</td>
                                    </tr>
                                    <tr className="border-b border-white/5">
                                        <td className="py-3 px-4">preferences</td>
                                        <td className="py-3 px-4">Functional</td>
                                        <td className="py-3 px-4">1 year</td>
                                        <td className="py-3 px-4">Remembering user preferences</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-neon-red/10 border border-neon-red/20 rounded-2xl p-8"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
                        <p className="leading-relaxed mb-4">
                            If you have any questions regarding our use of cookies, please do not hesitate to contact us:
                        </p>
                        <div className="space-y-2">
                            <p><strong className="text-white">Email:</strong> <a href="mailto:contact@dropsiders.fr" className="text-neon-red hover:underline">contact@dropsiders.fr</a></p>
                            <p><strong className="text-white">Website:</strong> <a href="https://www.dropsiders.eu" className="text-neon-red hover:underline">www.dropsiders.eu</a></p>
                        </div>
                    </motion.section>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-neon-red/10 border border-neon-red/20 rounded-2xl">
                        <Cookie className="w-8 h-8 text-neon-red" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
                        POLITIQUE DES COOKIES
                    </h1>
                </div>
                <p className="text-gray-400 text-sm">
                    Dernière mise à jour : 16 février 2026
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
                        <Cookie className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">1. Qu'est-ce qu'un cookie ?</h2>
                    </div>
                    <p className="leading-relaxed mb-3">
                        Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, tablette ou mobile) lorsque vous visitez un site web.
                        Les cookies permettent au site de mémoriser vos actions et préférences (comme la langue, la taille de police, et autres préférences d'affichage)
                        pendant une période donnée, afin que vous n'ayez pas à les saisir à chaque fois que vous revenez sur le site ou naviguez d'une page à l'autre.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">2. Comment utilisons-nous les cookies ?</h2>
                    <p className="leading-relaxed mb-4">
                        Dropsiders.eu utilise des cookies pour améliorer votre expérience de navigation et pour analyser l'utilisation de notre site.
                        Voici les différents types de cookies que nous utilisons :
                    </p>

                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <h3 className="text-xl font-semibold text-white">Cookies strictement nécessaires</h3>
                            </div>
                            <p className="leading-relaxed mb-2">
                                Ces cookies sont essentiels au fonctionnement du site. Ils vous permettent de naviguer sur le site et d'utiliser ses fonctionnalités.
                            </p>
                            <div className="mt-3 text-sm">
                                <p className="text-gray-400"><strong className="text-white">Durée :</strong> Session</p>
                                <p className="text-gray-400"><strong className="text-white">Exemples :</strong> Cookies de session, cookies de sécurité</p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                <h3 className="text-xl font-semibold text-white">Cookies analytiques</h3>
                            </div>
                            <p className="leading-relaxed mb-2">
                                Ces cookies nous permettent de comprendre comment les visiteurs utilisent notre site en collectant des informations de manière anonyme.
                                Cela nous aide à améliorer le fonctionnement du site.
                            </p>
                            <div className="mt-3 text-sm">
                                <p className="text-gray-400"><strong className="text-white">Durée :</strong> Jusqu'à 2 ans</p>
                                <p className="text-gray-400"><strong className="text-white">Exemples :</strong> Google Analytics, statistiques de visite</p>
                                <p className="text-gray-400"><strong className="text-white">Données collectées :</strong> Pages visitées, durée de visite, source de trafic</p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Settings className="w-5 h-5 text-purple-500" />
                                <h3 className="text-xl font-semibold text-white">Cookies de fonctionnalité</h3>
                            </div>
                            <p className="leading-relaxed mb-2">
                                Ces cookies permettent au site de mémoriser vos choix (comme votre nom d'utilisateur, la langue ou la région)
                                et de fournir des fonctionnalités améliorées et plus personnalisées.
                            </p>
                            <div className="mt-3 text-sm">
                                <p className="text-gray-400"><strong className="text-white">Durée :</strong> Jusqu'à 1 an</p>
                                <p className="text-gray-400"><strong className="text-white">Exemples :</strong> Préférences de langue, préférences d'affichage</p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Target className="w-5 h-5 text-orange-500" />
                                <h3 className="text-xl font-semibold text-white">Cookies de réseaux sociaux</h3>
                            </div>
                            <p className="leading-relaxed mb-2">
                                Ces cookies sont utilisés pour vous permettre de partager du contenu sur les réseaux sociaux comme Facebook, Instagram,
                                Twitter et YouTube. Ces cookies sont contrôlés par les réseaux sociaux respectifs.
                            </p>
                            <div className="mt-3 text-sm">
                                <p className="text-gray-400"><strong className="text-white">Durée :</strong> Variable selon le réseau social</p>
                                <p className="text-gray-400"><strong className="text-white">Exemples :</strong> Boutons de partage, widgets sociaux</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">3. Cookies tiers</h2>
                    <p className="leading-relaxed mb-4">
                        Certains cookies sur notre site sont placés par des services tiers. Nous utilisons les services suivants :
                    </p>
                    <div className="space-y-3">
                        <div className="bg-white/5 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-1">Google Analytics</h4>
                            <p className="text-sm leading-relaxed">
                                Pour analyser l'utilisation du site et améliorer nos services.
                                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline ml-1">
                                    Politique de confidentialité de Google
                                </a>
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-1">Réseaux sociaux</h4>
                            <p className="text-sm leading-relaxed">
                                Facebook, Instagram, TikTok, YouTube et Twitter peuvent placer des cookies lorsque vous interagissez avec leurs widgets sur notre site.
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-1">Spotify</h4>
                            <p className="text-sm leading-relaxed">
                                Pour afficher nos playlists intégrées.
                                <a href="https://www.spotify.com/privacy" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline ml-1">
                                    Politique de confidentialité de Spotify
                                </a>
                            </p>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Settings className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">4. Comment gérer les cookies ?</h2>
                    </div>
                    <p className="leading-relaxed mb-4">
                        Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. Vous pouvez supprimer tous les cookies déjà présents
                        sur votre ordinateur et configurer la plupart des navigateurs pour qu'ils les bloquent.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Paramètres du navigateur</h3>
                            <p className="leading-relaxed mb-2">
                                Vous pouvez gérer les cookies via les paramètres de votre navigateur :
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Google Chrome</a></li>
                                <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Mozilla Firefox</a></li>
                                <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Safari</a></li>
                                <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-neon-red hover:underline">Microsoft Edge</a></li>
                            </ul>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <p className="text-sm leading-relaxed">
                                <strong className="text-yellow-500">⚠️ Attention :</strong> Si vous bloquez tous les cookies, certaines fonctionnalités du site
                                peuvent ne pas fonctionner correctement. Par exemple, vous devrez peut-être ressaisir vos préférences à chaque visite.
                            </p>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">5. Cookies et données personnelles</h2>
                    <p className="leading-relaxed">
                        Les informations collectées via les cookies peuvent inclure des données personnelles. Ces données sont traitées conformément
                        à notre <a href="/privacy-policy" className="text-neon-red hover:underline">Politique de Confidentialité</a>.
                        Nous ne vendons jamais vos données à des tiers.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">6. Modifications de cette politique</h2>
                    <p className="leading-relaxed">
                        Nous pouvons mettre à jour cette politique des cookies de temps en temps pour refléter les changements dans nos pratiques
                        ou pour d'autres raisons opérationnelles, légales ou réglementaires. Nous vous encourageons à consulter régulièrement cette page.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">7. Tableau récapitulatif des cookies</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-white font-semibold">Nom du cookie</th>
                                    <th className="text-left py-3 px-4 text-white font-semibold">Type</th>
                                    <th className="text-left py-3 px-4 text-white font-semibold">Durée</th>
                                    <th className="text-left py-3 px-4 text-white font-semibold">Finalité</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">session_id</td>
                                    <td className="py-3 px-4">Nécessaire</td>
                                    <td className="py-3 px-4">Session</td>
                                    <td className="py-3 px-4">Gestion de la session utilisateur</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">_ga</td>
                                    <td className="py-3 px-4">Analytique</td>
                                    <td className="py-3 px-4">2 ans</td>
                                    <td className="py-3 px-4">Google Analytics - Distinction des utilisateurs</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">_gid</td>
                                    <td className="py-3 px-4">Analytique</td>
                                    <td className="py-3 px-4">24 heures</td>
                                    <td className="py-3 px-4">Google Analytics - Distinction des utilisateurs</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">preferences</td>
                                    <td className="py-3 px-4">Fonctionnel</td>
                                    <td className="py-3 px-4">1 an</td>
                                    <td className="py-3 px-4">Mémorisation des préférences utilisateur</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-neon-red/10 border border-neon-red/20 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">8. Nous contacter</h2>
                    <p className="leading-relaxed mb-4">
                        Si vous avez des questions concernant notre utilisation des cookies, n'hésitez pas à nous contacter :
                    </p>
                    <div className="space-y-2">
                        <p><strong className="text-white">Email :</strong> <a href="mailto:contact@dropsiders.fr" className="text-neon-red hover:underline">contact@dropsiders.fr</a></p>
                        <p><strong className="text-white">Site web :</strong> <a href="https://www.dropsiders.eu" className="text-neon-red hover:underline">www.dropsiders.eu</a></p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
