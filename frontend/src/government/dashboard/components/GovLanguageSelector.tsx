import { useGovLanguage } from "@/government/utils/GovLanguageContext";
import { Globe } from "lucide-react";

export function GovLanguageSelector() {
  const { language, setLanguage } = useGovLanguage();

  const getLabel = () => {
    switch (language) {
      case 'ta':
        return 'TA 🇮🇳';
      case 'hi':
        return 'HI 🇮🇳';
      default:
        return 'EN 🇬🇧';
    }
  };

  return (
    <div className="relative group z-50">
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-sm font-medium">
        <Globe className="h-4 w-4 text-slate-500" />
        <span className="text-slate-700 dark:text-slate-200 uppercase">{getLabel()}</span>
      </button>
      
      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
        <div className="py-1 flex flex-col">
          <button 
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'en' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
          >
            <span>English 🇬🇧</span>
            {language === 'en' && <span className="text-xs font-bold text-blue-600 dark:text-blue-400">✓</span>}
          </button>
          <button 
            onClick={() => setLanguage('ta')}
            className={`px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'ta' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
          >
            <span>தமிழ் 🇮🇳</span>
            {language === 'ta' && <span className="text-xs font-bold text-blue-600 dark:text-blue-400">✓</span>}
          </button>
          <button 
            onClick={() => setLanguage('hi')}
            className={`px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between ${language === 'hi' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
          >
            <span>हिंदी 🇮🇳</span>
            {language === 'hi' && <span className="text-xs font-bold text-blue-600 dark:text-blue-400">✓</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
