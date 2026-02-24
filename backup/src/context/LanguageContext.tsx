
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations } from '../data/translations';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('fr');

    useEffect(() => {
        const storedLang = localStorage.getItem('language') as Language;
        if (storedLang && (storedLang === 'fr' || storedLang === 'en')) {
            setLanguageState(storedLang);
        } else {
            // Detect browser language
            const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en';
            setLanguageState(browserLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        const translation = translations[key as keyof typeof translations];
        if (!translation) {
            console.warn(`Missing translation for key: ${key}`);
            return key;
        }
        return translation[language];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
