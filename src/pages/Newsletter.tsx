import { TrendingUp, Zap, Users, Bell, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { NewsletterForm } from '../components/widgets/NewsletterForm';
import { useLanguage } from '../context/LanguageContext';

export function Newsletter() {
    const { t } = useLanguage();

    const benefits = [
        {
            icon: <Zap className="w-8 h-8" />,
            title: t('newsletter.benefits.exclusive_news'),
            description: t('newsletter.benefits.exclusive_news_desc'),
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: t('newsletter.benefits.recaps'),
            description: t('newsletter.benefits.recaps_desc'),
        },
        {
            icon: <Bell className="w-8 h-8" />,
            title: t('newsletter.benefits.alerts'),
            description: t('newsletter.benefits.alerts_desc'),
        },
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: t('newsletter.benefits.content'),
            description: t('newsletter.benefits.content_desc'),
        },
    ];

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Hero Section */}
            <section className="relative min-h-[60vh] flex flex-col items-center justify-center px-6 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl mx-auto pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-red/10 blur-[120px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 blur-[120px] rounded-full mix-blend-screen" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto w-full text-center space-y-12">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center mb-8"
                    >
                        <img
                            src="/Logo.png"
                            alt="DROPSIDERS"
                            className="logo-img h-24 md:h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        />
                    </motion.div>

                    {/* Title */}
                    <div className="space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-6xl font-display font-black text-white uppercase italic tracking-tighter"
                        >
                            REJOIGNEZ <span className="text-neon-red">NOUS</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg md:text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed"
                        >
                            {t('newsletter.hero.desc')}
                        </motion.p>
                    </div>

                    {/* Form Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="max-w-xl mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <NewsletterForm variant="default" />
                    </motion.div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase italic tracking-tighter mb-4">
                            {t('newsletter.benefits.title')}
                        </h2>
                        <p className="text-gray-400 text-base">
                            {t('newsletter.benefits.subtitle')}
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
                                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight mb-3">
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
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
                        <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tight mb-6">
                            {t('newsletter.community.title')}
                        </h2>
                        <p className="text-gray-400 text-base leading-relaxed mb-8">
                            {t('newsletter.community.desc')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="px-6 py-3 bg-neon-red/10 border border-neon-red/30 rounded-full">
                                <span className="text-xs font-black text-neon-red uppercase tracking-widest">{t('newsletter.community.free')}</span>
                            </div>
                            <div className="px-6 py-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full">
                                <span className="text-xs font-black text-neon-cyan uppercase tracking-widest">{t('newsletter.community.no_spam')}</span>
                            </div>
                            <div className="px-6 py-3 bg-neon-purple/10 border border-neon-purple/30 rounded-full">
                                <span className="text-xs font-black text-neon-purple uppercase tracking-widest">{t('newsletter.community.easy_unsubscribe')}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
