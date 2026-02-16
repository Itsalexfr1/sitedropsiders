import { motion } from 'framer-motion';
import { FileText, AlertCircle, Scale, UserCheck, Ban } from 'lucide-react';

export function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-neon-red/10 border border-neon-red/20 rounded-2xl">
                        <FileText className="w-8 h-8 text-neon-red" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
                        CONDITIONS D'UTILISATION
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
                        <AlertCircle className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">1. Acceptation des conditions</h2>
                    </div>
                    <p className="leading-relaxed">
                        En accédant et en utilisant le site web Dropsiders.eu, vous acceptez d'être lié par les présentes conditions d'utilisation.
                        Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre site. Nous nous réservons le droit de modifier ces
                        conditions à tout moment. Votre utilisation continue du site après de telles modifications constitue votre acceptation des nouvelles conditions.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Scale className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">2. Propriété intellectuelle</h2>
                    </div>
                    <div className="space-y-4">
                        <p className="leading-relaxed">
                            Tout le contenu présent sur Dropsiders.eu, incluant mais non limité aux textes, graphiques, logos, images, vidéos,
                            clips audio et logiciels, est la propriété de Dropsiders ou de ses fournisseurs de contenu et est protégé par les
                            lois françaises et internationales sur le droit d'auteur.
                        </p>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Utilisation autorisée</h3>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Consultation personnelle et non commerciale du contenu</li>
                                <li>Partage sur les réseaux sociaux avec attribution appropriée</li>
                                <li>Citation de courts extraits avec mention de la source</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Utilisation interdite</h3>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Reproduction, distribution ou modification du contenu sans autorisation</li>
                                <li>Utilisation commerciale du contenu sans licence</li>
                                <li>Suppression des mentions de droit d'auteur ou de propriété</li>
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
                        <UserCheck className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">3. Utilisation acceptable</h2>
                    </div>
                    <p className="leading-relaxed mb-3">
                        Vous vous engagez à utiliser notre site de manière responsable et légale. Vous ne devez pas :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Utiliser le site d'une manière qui pourrait endommager, désactiver ou surcharger nos serveurs</li>
                        <li>Tenter d'accéder de manière non autorisée à notre système, serveurs ou réseaux</li>
                        <li>Utiliser des robots, scrapers ou autres moyens automatisés sans autorisation</li>
                        <li>Publier ou transmettre du contenu illégal, offensant, diffamatoire ou inapproprié</li>
                        <li>Violer les droits de propriété intellectuelle de tiers</li>
                        <li>Usurper l'identité d'une autre personne ou entité</li>
                        <li>Collecter des informations personnelles d'autres utilisateurs</li>
                    </ul>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">4. Contenu utilisateur</h2>
                    <p className="leading-relaxed mb-3">
                        Si vous soumettez du contenu sur notre site (commentaires, photos, etc.), vous garantissez que :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Vous possédez tous les droits nécessaires sur ce contenu</li>
                        <li>Le contenu ne viole aucun droit de tiers</li>
                        <li>Le contenu ne contient rien d'illégal ou d'offensant</li>
                    </ul>
                    <p className="mt-4 leading-relaxed">
                        En soumettant du contenu, vous nous accordez une licence mondiale, non exclusive, libre de redevances pour utiliser,
                        reproduire, modifier et afficher ce contenu dans le cadre de notre service.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">5. Liens externes</h2>
                    <p className="leading-relaxed">
                        Notre site peut contenir des liens vers des sites web tiers. Ces liens sont fournis uniquement pour votre commodité.
                        Nous n'avons aucun contrôle sur le contenu de ces sites et n'assumons aucune responsabilité quant à leur contenu ou
                        leurs pratiques de confidentialité. L'inclusion de tout lien n'implique pas notre approbation du site lié.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">6. Limitation de responsabilité</h2>
                    <p className="leading-relaxed mb-3">
                        Le site Dropsiders.eu est fourni "tel quel" sans garantie d'aucune sorte. Dans toute la mesure permise par la loi :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Nous ne garantissons pas que le site sera toujours disponible ou exempt d'erreurs</li>
                        <li>Nous ne sommes pas responsables des dommages directs, indirects ou consécutifs</li>
                        <li>Nous ne garantissons pas l'exactitude ou l'exhaustivité du contenu</li>
                        <li>Nous ne sommes pas responsables des virus ou autres éléments nuisibles</li>
                    </ul>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">7. Indemnisation</h2>
                    <p className="leading-relaxed">
                        Vous acceptez d'indemniser et de dégager de toute responsabilité Dropsiders, ses dirigeants, employés et partenaires
                        contre toute réclamation, perte, responsabilité, dommage, coût ou dépense (y compris les frais juridiques raisonnables)
                        découlant de votre utilisation du site ou de votre violation de ces conditions.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Ban className="w-6 h-6 text-neon-red" />
                        <h2 className="text-2xl font-bold text-white">8. Résiliation</h2>
                    </div>
                    <p className="leading-relaxed">
                        Nous nous réservons le droit de suspendre ou de résilier votre accès au site à tout moment, sans préavis,
                        si nous estimons que vous avez violé ces conditions d'utilisation ou pour toute autre raison à notre seule discrétion.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">9. Droit applicable</h2>
                    <p className="leading-relaxed">
                        Ces conditions d'utilisation sont régies par le droit français. Tout litige relatif à ces conditions sera soumis
                        à la compétence exclusive des tribunaux français.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">10. Modifications</h2>
                    <p className="leading-relaxed">
                        Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur
                        dès leur publication sur cette page. Nous vous encourageons à consulter régulièrement cette page pour rester
                        informé de toute modification.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="bg-neon-red/10 border border-neon-red/20 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
                    <p className="leading-relaxed mb-4">
                        Pour toute question concernant ces conditions d'utilisation, veuillez nous contacter :
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
