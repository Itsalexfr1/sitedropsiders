import { WikiWidget } from '../components/widgets/WikiWidget';
import { SEO } from '../components/utils/SEO';
import { motion } from 'framer-motion';

export function TopDropsiders() {
    return (
        <div className="min-h-screen bg-dark-bg pt-28 pb-20 overflow-hidden">
            <SEO 
                title="TOP DROPSIDERS - Le Classement Ultime" 
                description="Découvrez les meilleurs DJs, Clubs et Festivals du monde selon la communauté Dropsiders."
            />
            
            {/* Background elements - Optimized for performance */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-neon-yellow/5 blur-[80px] rounded-full will-change-transform" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-cyan/5 blur-[80px] rounded-full will-change-transform" />
            </div>

            <div className="w-full px-4 md:px-12 xl:px-16 2xl:px-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <WikiWidget resolvedColor="var(--color-neon-yellow)" />
                </motion.div>
            </div>
        </div>
    );
}
