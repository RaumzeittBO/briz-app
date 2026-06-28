import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        // Default to 'es' on fresh session/tab entry (persists across page reloads in the same tab)
        const sessionLang = sessionStorage.getItem('briz_language') as Language;
        if (!sessionLang) {
            // First time in this session, clear any stale translation cookies to force Spanish default
            document.cookie = "googtrans=/es/es; path=/";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
            
            // Clear for hostname scope as well
            const host = window.location.hostname;
            document.cookie = `googtrans=/es/es; path=/; domain=${host}`;
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host}`;
            
            return 'es';
        }
        return sessionLang;
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        sessionStorage.setItem('briz_language', lang);
        
        // 1. Set the googtrans cookie
        const cookieValue = lang === 'es' ? '/es/es' : '/es/en';
        document.cookie = `googtrans=${cookieValue}; path=/`;
        
        const host = window.location.hostname;
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${host}`;
        if (host.includes('.')) {
            const rootDomain = host.substring(host.indexOf('.'));
            document.cookie = `googtrans=${cookieValue}; path=/; domain=${rootDomain}`;
        }

        // 2. Reload the page once to let Google Translate initialize its MutationObserver 
        // cleanly on the fresh document, preventing React Virtual DOM conflicts.
        window.location.reload();
    };

    useEffect(() => {
        // 1. Inject visually hidden google translate element container (must be layout-active)
        if (!document.getElementById('google_translate_element')) {
            const div = document.createElement('div');
            div.id = 'google_translate_element';
            div.style.position = 'absolute';
            div.style.top = '-9999px';
            div.style.left = '-9999px';
            div.style.opacity = '0';
            div.style.pointerEvents = 'none';
            document.body.appendChild(div);
        }

        // 2. Define global init callback for Google Translate widget
        (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'en,es',
                layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
        };

        // 3. Inject Google Translate script if not present
        if (!document.getElementById('google-translate-script')) {
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.type = 'text/javascript';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            document.body.appendChild(script);
        }
    }, []);

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
