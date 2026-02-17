import { Mail, TrendingUp, Zap, Users, Bell, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { NewsletterForm } from '../components/widgets/NewsletterForm';

export function Newsletter() {
    const benefits = [
        {
            icon: <Zap className="w-8 h-8" />,
            title: 'Actualités en Exclusivité',
            description: 'Soyez les premiers informés des annonces de festivals, line-ups et événements électro.',
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: 'Recaps & Interviews',
            description: 'Recevez nos meilleurs recaps de festivals et interviews d\'artistes directement dans votre boîte mail.',
        },
        {
            icon: <Bell className="w-8 h-8" />,
            title: 'Alertes Billetterie',
            description: 'Ne ratez plus jamais la mise en vente des billets pour vos festivals préférés.',
        },
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: 'Contenus Exclusifs',
            description: 'Accédez à des contenus réservés aux abonnés : playlists, tips, bons plans...',
        },
    ];

    const stats = [
        { value: '60K+', label: 'Abonnés' },
        { value: '1x/semaine', label: 'Newsletters' },
        { value: '100+', label: 'Festivals couverts' },
    ];

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-red/20 blur-[120px] rounded-full" />
                <div className="absolute top-20 right-1/4 w-96 h-96 bg-neon-purple/20 blur-[120px] rounded-full" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neon-red/10 border border-neon-red/30 rounded-full mb-8"
                    >
                        <Mail className="w-4 h-4 text-neon-red" />
                        <span className="text-xs font-black text-neon-red uppercase tracking-widest">Newsletter Dropsiders</span>
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-display font-black text-white uppercase italic tracking-tighter leading-[0.9] mb-6"
                    >
                        Restez Connectés à la{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red via-neon-pink to-neon-purple">
                            Scène Électro
                        </span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 font-light leading-relaxed max-w-2xl mx-auto mb-12"
                    >
                        Rejoignez plus de <span className="text-white font-bold">60 000 passionnés</span> et recevez une fois par semaine
                        l'actualité des festivals, des interviews exclusives et des bons plans.
                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-16"
                    >
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-display font-black text-neon-red mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-500 font-bold uppercase tracking-wide">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Form Section */}
            <section className="py-16 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-display font-black text-white uppercase italic tracking-tight mb-4">
                                Inscrivez-vous Gratuitement
                            </h2>
                            <p className="text-gray-400">
                                Remplissez le formulaire ci-dessous pour recevoir nos newsletters
                            </p>
                        </div>

                        <NewsletterForm variant="default" />
                    </div>
                </motion.div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter mb-4">
                            Pourquoi S'abonner ?
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Découvrez tous les avantages de notre newsletter
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-neon-red/30 transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-neon-red/10 border border-neon-red/30 rounded-xl mb-6 text-neon-red group-hover:scale-110 transition-transform duration-300">
                                    {benefit.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-3">
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {benefit.description}
                                </p>

                                {/* Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-neon-red/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community Section */}
            <section className="py-20 px-6 relative overflow-hidden">
                {/* Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-red/5 to-transparent" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 md:p-16"
                    >
                        <Users className="w-16 h-16 text-neon-red mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tight mb-6">
                            Rejoignez la Communauté
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            Plus de <span className="text-white font-bold">60 000 festivaliers</span> nous font déjà confiance
                            pour rester informés de l'actualité de la scène électronique française et internationale.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-6 py-3 bg-neon-red/10 border border-neon-red/30 rounded-full">
                                <span className="text-sm font-black text-neon-red uppercase tracking-widest">100% Gratuit</span>
                            </div>
                            <div className="px-6 py-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full">
                                <span className="text-sm font-black text-neon-cyan uppercase tracking-widest">Sans Spam</span>
                            </div>
                            <div className="px-6 py-3 bg-neon-purple/10 border border-neon-purple/30 rounded-full">
                                <span className="text-sm font-black text-neon-purple uppercase tracking-widest">Désinscription Facile</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
