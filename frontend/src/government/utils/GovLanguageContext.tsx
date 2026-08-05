import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';

type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const GovLanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

export function useGovLanguage() {
  return useContext(GovLanguageContext);
}

// Helper to manage cookie
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/`;
  document.cookie = `${name}=${value};path=/;domain=${window.location.hostname}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function GovLanguageProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('govLanguage');
    if (saved === 'ta') return 'ta';
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('govLanguage', lang);
    setLanguageState(lang);
    if (lang === 'ta') {
      setCookie('googtrans', '/en/ta');
    } else {
      deleteCookie('googtrans');
    }
    // Reload to apply translation via Google script natively
    window.location.reload();
  };

  useEffect(() => {
    // Inject the script if language is Tamil and we are in government route
    if (language === 'ta' && location.pathname.startsWith('/government')) {
       const scriptId = 'google-translate-script';
       if (!document.getElementById(scriptId)) {
         window.googleTranslateElementInit = () => {
           if (window.google && window.google.translate) {
             new window.google.translate.TranslateElement(
               { pageLanguage: 'en', autoDisplay: false },
               'google_translate_element'
             );
           }
         };
         const script = document.createElement('script');
         script.id = scriptId;
         script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
         document.body.appendChild(script);
       }
    }
  }, [language, location.pathname]);

  useEffect(() => {
    // Route isolation: if leaving government routes, but Tamil is active, clear and reload
    if (!location.pathname.startsWith('/government')) {
       if (getCookie('googtrans')) {
           deleteCookie('googtrans');
           window.location.reload();
       }
    }
  }, [location.pathname]);

  return (
    <GovLanguageContext.Provider value={{ language, setLanguage }}>
      {/* Hidden element required for google translate */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      <style>{`
        /* Hide the Google Translate banner and iframe */
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
      `}</style>
      {children}
    </GovLanguageContext.Provider>
  );
}
