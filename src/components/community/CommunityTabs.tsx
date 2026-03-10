import { motion } from 'framer-motion';
import { Camera, Gamepad2, Info, Car, Bell, Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CommunityTabsProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

export function CommunityTabs({ activeTab, setActiveTab }: CommunityTabsProps) {
    const { t } = useLanguage();

    const tabs = [
        { id: 'WALL', icon: Star, label: t('communaute.tab_wall') },
        { id: 'PHOTOS', icon: Camera, label: t('communaute.tab_photos') },
        { id: 'QUIZZ', icon: Gamepad2, label: t('communaute.tab_quizz') },
        { id: 'AVIS', icon: Star, label: 'Avis & Notes' },
        { id: 'GUIDE', icon: Info, label: t('communaute.tab_guide') },
        { id: 'COVOIT', icon: Car, label: t('communaute.tab_covoit') },
        { id: 'ALERTS', icon: Bell, label: t('communaute.tab_alerts') }
    ];

    return (
        <div className="flex overflow-x-auto no-scrollbar items-center gap-2 p-1 bg-white/5 rounded-2xl max-w-full mb-8 md:w-fit">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-black' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="community-tab-bg"
                            className="absolute inset-0 bg-white rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? 'text-neon-red' : ''}`} />
                    <span className="relative z-10">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
