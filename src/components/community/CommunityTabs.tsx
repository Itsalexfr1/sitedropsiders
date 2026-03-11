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
        { id: 'WALL',    icon: Star,     label: t('communaute.tab_wall'),     multiline: false },
        { id: 'UPLOADS', icon: Camera,   label: t('communaute.tab_uploads'),  multiline: false },
        { id: 'QUIZZ',   icon: Gamepad2, label: 'Quiz',                       multiline: false },
        { id: 'AVIS',    icon: Star,     label: 'Avis',                       multiline: false },
        { id: 'GUIDE',   icon: Info,     label: 'Guide Pratique',             multiline: true  },
        { id: 'COVOIT',  icon: Car,      label: t('communaute.tab_covoit'),   multiline: false },
        { id: 'ALERTS',  icon: Bell,     label: t('communaute.tab_alerts'),   multiline: false },
    ];

    return (
        <div className="flex overflow-x-auto no-scrollbar items-center gap-1 p-1 pr-3 bg-white/5 rounded-2xl max-w-full mb-8 md:w-fit">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.12em] transition-all relative ${
                        activeTab === tab.id ? 'text-black' : 'text-gray-500 hover:text-white'
                    }`}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="community-tab-bg"
                            className="absolute inset-0 bg-white rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <tab.icon className={`w-3.5 h-3.5 relative z-10 flex-shrink-0 ${activeTab === tab.id ? 'text-[#FF0000]' : ''}`} />
                    {tab.multiline ? (
                        <span className="relative z-10 text-center leading-tight">
                            Guide<br />Pratique
                        </span>
                    ) : (
                        <span className="relative z-10">{tab.label}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

