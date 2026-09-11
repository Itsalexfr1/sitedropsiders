
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';
import {
    getInitialGuessedLanguage,
    detectUserCountryAndLanguage,
    isFrancophoneCountry,
    type SupportedLanguage
} from '../utils/geoLanguage';

type Language = SupportedLanguage;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    country: string | null;
    isFrancophone: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initial state: respect manual choice if set, otherwise use fast synchronous heuristic
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const isManual = localStorage.getItem('dropsiders_manual_lang') === 'true';
            const storedLang = localStorage.getItem('language') as Language;
            if (isManual && (storedLang === 'fr' || storedLang === 'en')) {
                return storedLang;
            }
        } catch {
            // ignore localStorage errors (e.g. private mode)
        }
        return getInitialGuessedLanguage();
    });

    const [country, setCountry] = useState<string | null>(() => {
        try {
            return localStorage.getItem('dropsiders_geo_country') || null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        let hasManualPreference = false;
        try {
            hasManualPreference = localStorage.getItem('dropsiders_manual_lang') === 'true';
        } catch {
            // ignore
        }

        let isMounted = true;
        detectUserCountryAndLanguage().then(({ country: detectedCountry, language: detectedLang }) => {
            if (!isMounted) return;

            if (detectedCountry) {
                setCountry(detectedCountry);
            }

            // If user has not explicitly set a manual preference, apply the detected country language
            if (!hasManualPreference) {
                setLanguageState(detectedLang);
                try {
                    localStorage.setItem('language', detectedLang);
                } catch {
                    // ignore
                }
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem('language', lang);
            localStorage.setItem('dropsiders_manual_lang', 'true');
        } catch {
            // ignore
        }
    };

    const t = (key: string): string => {
        const translation = translations[key as keyof typeof translations];
        if (!translation) {
            console.warn(`Missing translation for key: ${key}`);
            return key;
        }
        return translation[language];
    };

    const isFrancophone = country ? isFrancophoneCountry(country) : language === 'fr';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, country, isFrancophone }}>
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

