import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

function clearLegacyGoogleTranslateArtifacts() {
    try {
        document.cookie = 'googtrans=/es/es; path=/';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        const host = window.location.hostname;
        if (host) {
            document.cookie = `googtrans=/es/es; path=/; domain=${host}`;
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host}`;
            if (host.includes('.')) {
                const rootDomain = host.substring(host.indexOf('.'));
                document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${rootDomain}`;
            }
        }
    } catch {
        // Ignore cookie access errors in restricted environments
    }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const storedLang = (localStorage.getItem('briz_language') || sessionStorage.getItem('briz_language')) as Language | null;
        if (storedLang === 'en' || storedLang === 'es') {
            localStorage.setItem('briz_language', storedLang);
            sessionStorage.setItem('briz_language', storedLang);
            return storedLang;
        }
        return 'es';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('briz_language', lang);
        sessionStorage.setItem('briz_language', lang);
        clearLegacyGoogleTranslateArtifacts();
    };

    useEffect(() => {
        clearLegacyGoogleTranslateArtifacts();
        if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
        }
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
}
