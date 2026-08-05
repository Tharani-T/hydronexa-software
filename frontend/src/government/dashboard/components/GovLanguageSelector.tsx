import { useGovLanguage } from "@/government/utils/GovLanguageContext";
import { Globe } from "lucide-react";

export function GovLanguageSelector() {
  const { language, setLanguage } = useGovLanguage();

  return (
    <div className="relative group z-50">
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm text-sm font-medium">
        <Globe className="h-4 w-4 text-slate-500" />
        <span className="text-slate-700 dark:text-slate-200 uppercase">{language === 'en' ? 'EN 🇬🇧' : 'TA 🇮🇳'}</span>
      </button>
      
      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
        <div className="py-1 flex flex-col">
          <button 
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${language === 'en' ? 'font-bold text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
          >
            English 🇬🇧
          </button>
          <button 
            onClick={() => setLanguage('ta')}
            className={`px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${language === 'ta' ? 'font-bold text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}
          >
            தமிழ் 🇮🇳
          </button>
        </div>
      </div>
    </div>
  );
}
