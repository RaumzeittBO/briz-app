import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem('briz_language') as Language) || 'es';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('briz_language', lang);
        
        // Drive Google Translate programmatically with a robust retry mechanism
        const triggerGoogleTranslate = () => {
            const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (selectEl) {
                selectEl.value = lang;
                selectEl.dispatchEvent(new Event('change'));
                return true;
            }
            return false;
        };

        // Try immediately
        if (!triggerGoogleTranslate()) {
            // If the element is not ready yet (e.g., script still loading), retry every 200ms
            let retries = 0;
            const interval = setInterval(() => {
                retries++;
                if (triggerGoogleTranslate() || retries >= 15) {
                    clearInterval(interval);
                }
            }, 200);
        }
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

        // 2. Define global init callback
        (window as any).googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'en,es',
                layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            // Apply language on load after translate element finishes loading
            let retries = 0;
            const checkAndApply = () => {
                const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                if (selectEl) {
                    if (language !== 'es') {
                        selectEl.value = language;
                        selectEl.dispatchEvent(new Event('change'));
                    }
                } else if (retries < 15) {
                    retries++;
                    setTimeout(checkAndApply, 200);
                }
            };
            setTimeout(checkAndApply, 500);
        };

        // 3. Inject Google Translate script if not present
        if (!document.getElementById('google-translate-script')) {
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.type = 'text/javascript';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            document.body.appendChild(script);
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
